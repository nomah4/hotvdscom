import { Outlet } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { ChatWidget } from '../../support/ChatWidget';

export function MarketingLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      {/* Chat lives on the marketing pages and in the account, not on checkout:
          a bubble overlapping the confirm button while someone is deciding to pay
          is worse than no chat. Checkout sits outside this layout already. */}
      <ChatWidget />
    </>
  );
}
