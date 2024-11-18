import React, { useEffect, useState } from "react";
import SearchOrder from "./SearchOrder";
import OrderTable from "../placeOrder/OrderTable";
import { db } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import { updateOrder } from "@/app/redux/slices/orderSlice";
import { selectUser } from "@/app/redux/slices/authSlice";

const Order = () => {
  const dispatch = useDispatch();
  const [limits, setLimits] = useState(false);
  const [limit, setLimit] = useState(30);
  const user = useSelector(selectUser);
  useEffect(() => {
    setLimits(
      ((user.staff_role === "Admin" ||
        user.staff_role === "HR" ||
        user.staff_role === "CEO") &&
        true) ||
        false
    );
  }, []);

  useEffect(() => {
    limits ? setLimit(400) : setLimit(30)
  }, [limits])
  

  // Get order from firebase database
  useEffect(() => {
    const unSub = db
      .collection("placeOrder")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .onSnapshot((snap) => {
        const order = [];
        snap.docs.map((doc) => {
          order.push({
            id: doc.id,
            ...doc.data(),
            // timestamp: doc.data().timestamp?.toDate().getTime(),
          });
        });
        dispatch(updateOrder(order));
      });
    return () => {
      unSub();
    };
  }, [limit]);

  return (
    <main>
      <div className="grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700 ">Orders</h1>
        <SearchOrder />
        <OrderTable />
      </div>
    </main>
  );
};

export default Order;
