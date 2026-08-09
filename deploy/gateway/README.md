# The gateway

`167.179.34.32` is not the machine that serves this site. It is a gateway named `gw` — itself a
KVM guest — with a foot in each network, and the storefront is one of six things behind it.

```
eth0  167.179.34.32/24   public, default via 167.179.34.1
eth1  10.0.1.1/24        private segment, the four service VMs
```

Recorded 2026-08-09 by reading the host. Ubuntu 24.04, up 31 days.

## What is behind it

| Host | Internal | Port | What |
|---|---|---|---|
| `hotvds.com` | — | 8443 | this storefront, `/var/www/hotvds.com/current` |
| `dev.hotvds.com` | — | 8443 | staging, `/var/www/dev.hotvds.com/dist` |
| `bl.hotvds.com` | `10.0.1.11` | 8000 | Billing |
| `po.hotvds.com` | `10.0.1.12` | 8001 | Payment Orchestrator |
| `pr.hotvds.com` | `10.0.1.13` | 8002 | Provisioning |
| `chat.hotvds.com` | `10.0.1.14` | 3000 | Chatwoot |

The two storefront vhosts run on the gateway itself; the other four are separate VMs on the
private segment. `8000` / `8001` / `8002` are the ports the billing infrastructure spec assigns
to those three services.

## How a request reaches a VM

Nothing about this path is NAT. Port 443 is answered by nginx `stream{}`, which reads the
server name out of the TLS handshake without decrypting it (`ssl_preread`) and forwards the
connection to a local port. A vhost on that port terminates TLS and proxies over `eth1`.

```
:443 ─ stream{} ssl_preread ─ 127.0.0.1:844x ─ TLS terminated ─ 10.0.1.x:port
```

Both halves are in `../nginx/`: the SNI map in `stream.conf`, the vhosts in
`conf.d-admin-proxy.conf`. Every certificate lives on the gateway; the VMs never see TLS.

## What NAT there is

`nftables.conf` here is a copy of `/etc/nftables.conf`. It does two things:

- **Outbound.** `10.0.1.0/24` is masqueraded out of `eth0`, so the VMs reach the internet.
- **Inbound SSH.** TCP `2201`–`2204` on the public address DNAT to port 22 of `.11`–`.14`
  respectively. That is the only way in to those machines.

The forward chain defaults to `drop` and admits three things: established/related, anything
leaving the private segment, and `ct status dnat` — which accepts whatever the prerouting chain
happened to redirect. Today that is only the four SSH ports, but the rule accepts any DNAT added
later without a matching decision here.

## Three things to know before touching it

**Nothing manages this file.** Its header says `Managed by ansible (gateway_nat role) — do not
edit by hand`, and there is no `gateway_nat` role — not in this repository and not in the
infrastructure repository that header points at. The rules were applied by hand. `nftables` is
enabled, so they survive a reboot; nothing else keeps them true.

**Every VM's SSH is on the public internet.** Ports 2201–2204 are open to everyone, including
Billing's. There is no source restriction, no `ufw` (it is inactive), and the gateway's own
input chain is `policy accept` with no rules — so the host firewall permits everything that
reaches it.

**Unknown SNI used to land on Billing.** `default` in `stream.conf` was `127.0.0.1:8444`, so a
connection with no recognised server name — a scanner walking the IP range, a stale DNS entry, a
client sending no SNI at all — was handed to the money service. Fixed 2026-08-09: it goes to
`127.0.0.1:8448` now and is answered 502 (`../nginx/conf.d-default-sni-reject.conf`). Verified
against both an unknown name and the bare IP; all six real hostnames still serve.

`stream{}` matches below HTTP and has no status codes of its own, which is why refusing with a
502 takes a real http server and a terminated handshake rather than one line in the map.

## Reading it back

```sh
ssh root@167.179.34.32 'nft list ruleset'    # effective rules
ssh root@167.179.34.32 'nginx -T'            # effective nginx config
ssh root@167.179.34.32 'ip neigh show dev eth1'   # which VMs are actually up
```

As with `../nginx/`, these files are a **record**. Nothing deploys them, and a change made on
the host is not here until someone pulls it back.
