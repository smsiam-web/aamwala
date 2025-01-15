import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/app/utils/firebase";
import { jsPDF } from "jspdf"; // Import jsPDF
import "jspdf-autotable";

const OrderIdTableView = () => {
  const router = useRouter();
  const [dispatchData, setDispatchData] = useState([]);
  const [dispatchId, setDispatchId] = useState(router.asPath?.split("=")[1]);

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
  useEffect(() => {
    filters();
  }, []);

  console.log(dispatchData);
  // Validate and extract valid order IDs
  const maxOrders = dispatchData?.length;
  const limitedOrders = dispatchData.slice(0, maxOrders); // Slice to limit the orders

  // Create a 10x10 grid (array of arrays)
  const gridData = Array.from({ length: 10 }, (_, rowIndex) =>
    Array.from({ length: 10 }, (_, colIndex) => {
      const orderIndex = rowIndex * 10 + colIndex;
      return limitedOrders[orderIndex] ? limitedOrders[orderIndex].sfc : ""; // Show length of ID
    })
  );

  // Function to generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    // Define the table columns (5 columns for Order IDs)
    const tableColumns = [
      "Order ID",
      "Order ID",
      "Order ID",
      "Order ID",
      "Order ID",
    ];

    // Prepare rows, ensuring we have 10 rows and 5 columns for the grid
    const tableRows = [];
    let row = [];
    for (let i = 0; i < 50; i++) {
      row.push(dispatchData[i]?.sfc || ""); // Add Order ID or empty string if there are fewer than 50
      if (row.length === 5) {
        tableRows.push(row);
        row = []; // Reset the row after it has 5 items
      }
    }

    // Add title to the PDF
    doc.text("Order IDs Grid (10x5)", 20, 10);

    // Generate the table with autoTable plugin
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 20, // Start the table below the title
      theme: "grid", // Add grid lines to the table
      styles: {
        cellPadding: 5,
        fontSize: 10,
        halign: "center",
      },
      headStyles: {
        fillColor: [22, 160, 133], // Custom color for headers
        textColor: 255, // White text in the header
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Light gray rows
      },
    });

    // Save the generated PDF
    doc.save("Order_IDs_10x5_Grid.pdf");
  };

  return (
    <div className="overflow-x-auto">
      {gridData.length === 0 ? (
        <p>No valid orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-200 w-full">
            <thead>
              <tr className="bg-gray-100">
                {/* {Array.from({ length: 10 }).map((_, index) => (
                  <th key={index} className="border border-gray-200 px-4 py-2">
                    Col {index + 1}
                  </th>
                ))} */}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-gray-200 px-4 py-2 text-center"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Button to generate PDF */}
      <button
        onClick={generatePDF}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Generate PDF
      </button>
    </div>
  );
};

export default OrderIdTableView;
