import React, { useEffect, useRef, useState } from "react";
import Button from "../../shared/Button";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import { db } from "@/app/utils/firebase";
import { useDispatch } from "react-redux";
import { updateSingleOrder } from "@/app/redux/slices/singleOrderSlice";
import { notifications } from "@mantine/notifications";
import firebase from "firebase";
import "firebase/storage";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { LoadingOverlay, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

const DailyDeliveryReport = () => {
  const inputRef = useRef(null);
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState("RA013");
  const [dispatchId, setDispatchId] = useState(router.asPath?.split("=")[1]);
  const [opened, { open, close }] = useDisclosure(false);
  const [filterOrder, setFilterOrder] = useState(null);
  const [dispatchData, setDispatchData] = useState([]);
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const handleChange = (e) => {
    setCurrentValue(e.currentTarget.value);
  };

  // console.log(filterOrder, dispatchData);
  const playNotificationSound = () => {
    const audio = new Audio("/sucess.wav");
    audio
      .play()
      .catch((error) => console.error("Failed to play sound:", error));
  };

  const addDispatch = () => {
    const value = currentValue?.toUpperCase();

    // Check if the value matches the required format
    if (value?.startsWith("RA") && value.length === 9) {
      const duplicate =
        dispatchData?.length && dispatchData.find((i) => i.id === value);

      if (duplicate) {
        // Notify if the ID is already dispatched
        notifications.show({
          title: `Duplicate Entry`,
          message: `The ID "${value}" has already been dispatched Sl No:${duplicate?.sl}.`,
          color: "red",
          autoClose: 6000,
        });
        if (inputRef.current) {
          inputRef.current.focus(); // Focus the input after dispatch
        }
        togleClose();
      } else {
        // Process the ID if it's valid and not a duplicate
        filter(value);
        if (inputRef.current) {
          inputRef.current.focus(); // Focus the input after dispatch
        }
      }
    } else {
      // Notify if the ID is invalid
      notifications.show({
        title: `Invalid ID`,
        message: `The entered ID "${value}" is invalid. Please ensure it starts with "RA" and is 9 characters long.`,
        color: "red",
        autoClose: 4000,
      });
      if (inputRef.current) {
        inputRef.current.focus(); // Focus the input after dispatch
      }
    }
  };

  const filter = async (id) => {
    await db
      .collection("placeOrder")
      .doc(id)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          if (doc.data()?.status !== "Processing") {
            setFilterOrder(doc.data());
            open();
          } else {
            console.log(dispatchData?.length);
            const singleOrder = {
              sl: dispatchData?.length + 1 || 1,
              id: doc.id,
              sfc: doc.data()?.sfc.consignment_id,
              customerName: doc.data()?.customer_details?.customer_name,
              contact: doc.data()?.customer_details?.phone_number,
              wgt: doc.data()?.weight,
              cod: doc.data()?.customer_details?.salePrice,
              status: doc.data()?.status,
            };
            console.log(singleOrder);
            createDispatch(dispatchId, singleOrder);
            setFilterOrder(singleOrder);
            setCurrentValue("RA013");
            // open();
          }
        }
      });
  };

  const createDispatch = async (dispatchId, singleOrder) => {
    try {
      // Step 1: Validate inputs
      if (!dispatchId || !singleOrder) {
        throw new Error("dispatchId and singleOrder are required!");
      }

      // Step 2: Perform preparatory actions
      console.log("Preparing to add data...");
      console.log("Dispatch ID:", dispatchId);
      console.log("Single Order:", singleOrder);

      // Step 3: Perform the Firebase operation
      await db
        .collection("dispatch")
        .doc(dispatchId)
        .set(
          {
            dispatches: firebase.firestore.FieldValue.arrayUnion(singleOrder),
          },
          { merge: true } // Ensures only the "dispatches" field is updated
        );

      // Step 4: Call filters and log success
      filters();
      playNotificationSound();
      notifications.show({
        title: `Order #${singleOrder?.id} Added Successfully!`,
        message: `The order details have been successfully updated.`,
        color: "blue",
        autoClose: 4000,
      });
      console.log("Data merged successfully!");
    } catch (err) {
      // Handle errors
      console.error("Error merging data:", err);
    }
  };

  // Get order from firebase database
  const filters = async () => {
    await db
      .collection("dispatch")
      .doc(dispatchId)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          setDispatchData(doc.data().dispatches);
        }
      });
  };

  const togleClose = async () => {
    close();
    setCurrentValue("RA013");
  };

  const deleteItem = (id) => {
    const updatedDispatchData = dispatchData.filter((item) => item.id !== id);
    console.log(updatedDispatchData); // Log the new array after deletion
  };

  useEffect(() => {
    filters();
  }, [dispatchId]);

  return (
    <>
      <Modal opened={opened} onClose={close} title="Create Dispatch By Date">
        <div className="flex items-center justify-center flex-col">
          <div>
            <h1 className="text-center text-2xl font-semibold pb-1">
              ID #{filterOrder?.id} ({filterOrder?.status})
            </h1>
            <h1 className="text-center text-2xl font-semibold border-b pb-3">
              {/* {filterOrder?.sfc || null} */}
            </h1>
          </div>
          <Button
            onClick={() => togleClose()}
            title={"Close"}
            className="bg-orange-400 hover:bg-orange-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
            icon=<AiOutlineAppstoreAdd size={24} />
          />
        </div>
      </Modal>
      <h1 className="text-4xl font-bold text-center">DISPATCH</h1>
      <h1 className="text-9xl font-semibold text-center">
        {dispatchData?.length || 0}
      </h1>
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex">
            <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
              <div className="flex-grow-0  md:flex-grow lg:flex-grow xl:flex-grow">
                <input
                  ref={inputRef}
                  className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleChange(e)}
                  placeholder="Search by #ID"
                />
              </div>
            </div>

            <div className="w-full md:w-56 lg:w-56 xl:w-56">
              <Button
                onClick={() => addDispatch()}
                title="Add"
                className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<AiOutlineAppstoreAdd size={24} />
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <table className="w-full whitespace-nowrap table-auto">
          <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
            <tr>
              <th className="px-4 py-3 ">SL</th>
              <th className="px-4 py-3 ">invoice no</th>
              <th className="px-4 py-3  ">SFC ID</th>
              <th className="px-4 py-3  ">NAME</th>
              <th className="px-4 py-3  ">Phone no.</th>
              <th className="px-4 py-3">WGT</th>
              <th className="px-4 py-3">COD</th>
              <th className="px-4 py-3 ">status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 ">
            <>
              {!!dispatchData &&
                [...dispatchData].reverse().map((item, index) => (
                  <tr
                    className={`${item?.isFilter && "bg-sky-200"} ${
                      item.status.toLowerCase() === "delivered" &&
                      "bg-green-200"
                    } ${
                      item.customer_details?.markAs === "Argent" &&
                      "bg-green-100"
                    }`}
                    key={index}
                  >
                    <td className="px-4 py-3 font-bold">
                      <span className="text-sm">
                        {item.sl < 9 && 0}
                        {item.sl}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className="text-sm">#{item.id}</span>
                    </td>
                    <td className="px-4 py-3 font-bold ">
                      <span className="text-sm">{item?.sfc}</span>
                    </td>
                    <td className="px-4 py-3 font-bold ">
                      <span className="text-sm">{item?.customerName}</span>
                    </td>
                    <td className="px-4 py-3 font-bold ">
                      <span className="text-sm">{item?.contact}</span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className="text-sm">{item?.wgt}Kg</span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className="text-sm">{item?.cod}tk</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-serif">
                        <span
                          className={`${
                            item.status.toLowerCase() === "pending" &&
                            "text-gray-700 bg-gray-200"
                          } ${
                            item.status.toLowerCase() === "hold" &&
                            "text-gray-700 bg-gray-200"
                          } ${
                            item.status.toLowerCase() === "processing" &&
                            "text-yellow-500 bg-yellow-100"
                          } ${
                            item.status.toLowerCase() === "shipped" &&
                            "text-indigo-500 bg-indigo-100"
                          } ${
                            item.status.toLowerCase() === "delivered" &&
                            "text-green-500 bg-green-100"
                          } ${
                            item.status.toLowerCase() === "returned" &&
                            "bg-teal-100 text-teal-500"
                          } ${
                            item.status.toLowerCase() === "cancelled" &&
                            "bg-red-100 text-red-500"
                          } inline-flex px-2 text-xs capitalize font-medium leading-5 rounded-full`}
                        >
                          {item?.status}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
            </>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DailyDeliveryReport;
