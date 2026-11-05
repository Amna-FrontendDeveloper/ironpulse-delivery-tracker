import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

jest.mock("../services/api");
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const sampleDelivery = {
  _id: "delivery-123",
  trackingNumber: "IP-1001",
  customerName: "Ali Khan",
  deliveryAddress: "Model Town, Lahore",
  status: "Pending",
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Driver Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { name: "Test Driver" },
      logout: jest.fn().mockResolvedValue(),
    });
  });

  test("shows a loading message while deliveries are being fetched", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderDashboard();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your deliveries"
    );
  });

  test("loads and displays the driver's delivery details", async () => {
    api.get.mockResolvedValue({ data: [sampleDelivery] });
    renderDashboard();

    expect(await screen.findByText("Ali Khan")).toBeInTheDocument();
    expect(screen.getByText("IP-1001")).toBeInTheDocument();
    expect(screen.getByText("Model Town, Lahore")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  test("updates a delivery status and updates the table without reloading", async () => {
    api.get.mockResolvedValue({ data: [sampleDelivery] });
    api.patch.mockResolvedValue({
      data: { ...sampleDelivery, status: "Picked Up" },
    });
    renderDashboard();

    fireEvent.click(await screen.findByRole("button", { name: "Mark Picked" }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        "/api/deliveries/delivery-123",
        { status: "Picked Up" }
      );
    });
    expect(await screen.findByText("Picked")).toBeInTheDocument();
  });

  test("shows a useful message when the delivery request fails", async () => {
    api.get.mockRejectedValue({
      response: { data: { message: "Server is unavailable" } },
    });
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server is unavailable"
    );
  });

  test("shows an empty state when no deliveries are assigned", async () => {
    api.get.mockResolvedValue({ data: [] });
    renderDashboard();

    expect(
      await screen.findByText("No deliveries are assigned to you yet.")
    ).toBeInTheDocument();
  });
});
