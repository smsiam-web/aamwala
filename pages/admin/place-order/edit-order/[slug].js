import EditOrder from "@/admin/components/placeOrder/edit_order";
import OrderDetails from "@/admin/components/placeOrder/singleOrder";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const SingleEdit = () => {
  return (
    <div>
      <Link href={"/admin/place-order"}>
        <div className="flex items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <EditOrder disabled={true} />
    </div>
  );
};

export default SingleEdit;
