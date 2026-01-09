// Pi Network SDK Type Definitions
// Based on: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md

export interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

export interface PiPaymentData {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  from_address: string;
  to_address: string;
  direction: 'user_to_app' | 'app_to_user';
  created_at: string;
  network: 'Pi Network' | 'Pi Testnet';
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPaymentData) => void;
}

export interface PiPaymentRequest {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface Pi {
  init: (config: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: PiPaymentData) => void
  ) => Promise<PiAuthResult>;
  createPayment: (
    paymentData: PiPaymentRequest,
    callbacks: PiPaymentCallbacks
  ) => void;
  openShareDialog: (title: string, message: string) => void;
  nativeFeaturesList: () => Promise<string[]>;
}

declare global {
  interface Window {
    Pi?: Pi;
  }
}

export {};
