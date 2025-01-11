import React, { useEffect, useState } from "react";
import { LoadingOverlay, Modal } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import AddBy from "./addBy";
import { DatePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import Button from "../shared/Button";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import { db } from "@/app/utils/firebase";

const DeliveryReports = () => {
  const [value, setValue] = useState(new Date() || null);
  const [data, setData] = useState({});
  const [title, setTitle] = useState("Create");
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const formattedDate = value.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const cg = formattedDate.replace(/ /g, "-").replace(",", "");

  // toggle drawer
  const createDispatch = async () => {
    setLoading(true);
    try {
      await getDispatch();
      console.log(`Document "${cg}" successfully written.`);
      return { success: true };
    } catch (err) {
      console.error(`Error writing document "${docId}":`, err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    db.collection("dispatch")
      .doc(cg)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          setTitle("Update");
        } else {
          setTitle("Create");
        }
      });
  }, [opened, value]);

  // get dispatch
  const getDispatch = async () => {
    await db
      .collection("dispatch")
      .doc(cg)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          router.push(`/admin/delivery-report/create-dispatch?date=${cg}`);
        } else {
          db.collection("dispatch").doc(cg).set(data);
          router.push(`/admin/delivery-report/create-dispatch?date=${cg}`);
        }
      });
  };

  return (
    <main className="h-full overflow-y-auto">
      <div>
        <Modal opened={opened} onClose={close} title="Create Dispatch By Date">
          <div className="flex items-center justify-center flex-col">
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "blue", type: "bars" }}
            />
            <DatePicker value={value} onChange={setValue} />

            <Button
              onClick={() => createDispatch()}
              title={title}
              className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
              icon=<AiOutlineAppstoreAdd size={24} />
            />
          </div>
        </Modal>
      </div>
      <div className="grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700 ">
          Daily Dispatch
        </h1>
        <AddBy onClick={() => open()} />
      </div>
    </main>
  );
};

export default DeliveryReports;
