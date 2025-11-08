"use client";

// Test page to verify Firebase Client SDK connection
// Visit: http://localhost:3000/test-firebase

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { ref, listAll } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";

type TestResult = {
  status: "loading" | "success" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export default function TestFirebasePage() {
  const [clientTest, setClientTest] = useState<TestResult>({
    status: "loading",
    message: "Testing Firebase Client SDK...",
  });
  const [adminTest, setAdminTest] = useState<TestResult>({
    status: "loading",
    message: "Testing Firebase Admin SDK...",
  });

  useEffect(() => {
    // Test Client SDK
    async function testClientSDK() {
      try {
        // Test 1: Read from Firestore (allowed by POC security rules)
        const eventsRef = collection(db, "events");
        const snapshot = await getDocs(eventsRef);

        // Test 2: Check Storage access
        const storageRef = ref(storage);
        const storageList = await listAll(storageRef);

        setClientTest({
          status: "success",
          message: "Firebase Client SDK connected successfully! ✅",
          details: {
            firestore: {
              connected: true,
              eventsCount: snapshot.size,
            },
            storage: {
              connected: true,
              itemsCount: storageList.items.length + storageList.prefixes.length,
            },
          },
        });
      } catch (error) {
        setClientTest({
          status: "error",
          message: `Firebase Client SDK connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          } ❌`,
          details: {
            hint: "Check your NEXT_PUBLIC_FIREBASE_* environment variables",
          },
        });
      }
    }

    // Test Admin SDK via API route
    async function testAdminSDK() {
      try {
        const response = await fetch("/api/test-firebase");
        const data = await response.json();

        if (data.success) {
          setAdminTest({
            status: "success",
            message: data.message,
            details: data.tests,
          });
        } else {
          setAdminTest({
            status: "error",
            message: data.message,
            details: { error: data.error, hint: data.hint },
          });
        }
      } catch (error) {
        setAdminTest({
          status: "error",
          message: "Failed to test Admin SDK",
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }

    testClientSDK();
    testAdminSDK();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "800px" }}>
      <h1 style={{ marginBottom: "2rem" }}>🔥 Firebase SDK Test</h1>

      {/* Client SDK Test */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Firebase Client SDK (Frontend)</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor:
              clientTest.status === "success"
                ? "#d4edda"
                : clientTest.status === "error"
                ? "#f8d7da"
                : "#fff3cd",
            border: `1px solid ${
              clientTest.status === "success"
                ? "#c3e6cb"
                : clientTest.status === "error"
                ? "#f5c6cb"
                : "#ffeeba"
            }`,
            borderRadius: "4px",
          }}
        >
          <strong>Status:</strong> {clientTest.status}
          <br />
          <strong>Message:</strong> {clientTest.message}
          {clientTest.details && (
            <>
              <br />
              <pre style={{ marginTop: "0.5rem", fontSize: "12px" }}>
                {JSON.stringify(clientTest.details, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>

      {/* Admin SDK Test */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Firebase Admin SDK (Backend)</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor:
              adminTest.status === "success"
                ? "#d4edda"
                : adminTest.status === "error"
                ? "#f8d7da"
                : "#fff3cd",
            border: `1px solid ${
              adminTest.status === "success"
                ? "#c3e6cb"
                : adminTest.status === "error"
                ? "#f5c6cb"
                : "#ffeeba"
            }`,
            borderRadius: "4px",
          }}
        >
          <strong>Status:</strong> {adminTest.status}
          <br />
          <strong>Message:</strong> {adminTest.message}
          {adminTest.details && (
            <>
              <br />
              <pre style={{ marginTop: "0.5rem", fontSize: "12px" }}>
                {JSON.stringify(adminTest.details, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>

      {/* Environment Variables Check */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Environment Variables</h2>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#e7f3ff",
            border: "1px solid #b3d9ff",
            borderRadius: "4px",
          }}
        >
          <h3>Public (Client SDK)</h3>
          <ul style={{ fontSize: "14px" }}>
            <li>
              NEXT_PUBLIC_FIREBASE_API_KEY:{" "}
              {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing"}
            </li>
            <li>
              NEXT_PUBLIC_FIREBASE_PROJECT_ID:{" "}
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                ? `✓ ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
                : "✗ Missing"}
            </li>
            <li>
              NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:{" "}
              {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
                ? "✓ Set"
                : "✗ Missing"}
            </li>
            <li>
              NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:{" "}
              {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
                ? "✓ Set"
                : "✗ Missing"}
            </li>
          </ul>

          <h3>Private (Admin SDK - server-side only)</h3>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Environment variables are not exposed to the browser.
            <br />
            Check the Admin SDK test result above to verify they are loaded.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
        <h3>Next Steps</h3>
        <ol style={{ fontSize: "14px" }}>
          <li>If both tests pass ✅, your Firebase SDKs are correctly configured!</li>
          <li>If tests fail ❌, check your <code>.env.local</code> file has all variables set</li>
          <li>Restart the dev server after updating environment variables</li>
          <li>Delete this test page once verification is complete</li>
        </ol>
      </div>
    </div>
  );
}
