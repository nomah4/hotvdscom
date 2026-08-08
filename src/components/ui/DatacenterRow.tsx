import styled from 'styled-components';
import { DatacenterBadge } from './DatacenterBadge';
import { datacenters as allDatacenters, type Datacenter } from '../../data/datacenters';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
`;

interface DatacenterRowProps {
  /** Defaults to every location; the datacenters page passes filtered groups. */
  items?: readonly Datacenter[];
}

/**
 * The row of location badges, lifted out of HomePage once the datacenters page
 * needed the same thing three times over (all, live, coming soon). Shared so the
 * two pages cannot drift apart on how a location is presented.
 */
export function DatacenterRow({ items = allDatacenters }: DatacenterRowProps) {
  return (
    <Row>
      {items.map((dc) => (
        <DatacenterBadge key={dc.id} datacenter={dc} />
      ))}
    </Row>
  );
}
