import { toast } from "sonner";

interface PaymentOptions {
  amount: number;
  currency: string;
  orderId?: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
}

// Helper to dynamically load the Razorpay script if it's missing or blocked
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializeRazorpayPayment = async (
  options: PaymentOptions,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  // Ensure script is loaded
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !window.Razorpay) {
    toast.error("Razorpay SDK could not be loaded. Please disable your ad-blocker and try again.");
    return;
  }

  const Razorpay = window.Razorpay;
  const RAZORPAY_KEY_ID = "rzp_live_Rxvn7fqMFo62r3"; //

  const paymentOptions = {
    key: RAZORPAY_KEY_ID,
    amount: options.amount * 100,
    currency: options.currency,
    name: options.name,
    description: options.description,
    image: "/image.png",
    order_id: options.orderId,
    handler: function (response: any) {
      onSuccess(response);
    },
    prefill: options.prefill,
    notes: options.notes,
    theme: options.theme || {
      color: "#ff8c00",
    },
    modal: {
      ondismiss: function () {
        toast.info("Payment cancelled");
      },
    },
  };

  try {
    const rzp = new Razorpay(paymentOptions);
    
    rzp.on("payment.failed", function (response: any) {
      onFailure(response.error);
    });

    rzp.open();
  } catch (error) {
    console.error("Razorpay Initialization Error:", error);
    toast.error("Failed to initialize payment gateway.");
  }
};
