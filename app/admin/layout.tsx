import { SELLER_BRAND } from "@/lib/academy";
import SignOutButton from "./signout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="brand">
            {SELLER_BRAND}
            <small>Phone Academy · Versant training</small>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="container">{children}</div>
    </>
  );
}
