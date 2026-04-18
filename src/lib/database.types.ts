export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          kyc_status: string | null;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          kyc_status?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          kyc_status?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      balances: {
        Row: {
          id: string;
          user_id: string | null;
          currency: string | null;
          amount: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          currency?: string | null;
          amount?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          currency?: string | null;
          amount?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          type: string | null;
          status: string | null;
          currency_in: string | null;
          currency_out: string | null;
          amount_in: string | null;
          amount_out: string | null;
          rate: string | null;
          rate_mode: string | null;
          payment_reference: string | null;
          wallet_address: string | null;
          txn_hash: string | null;
          incoming_hash: string | null;
          outgoing_hash: string | null;
          clearing_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          status?: string | null;
          currency_in?: string | null;
          currency_out?: string | null;
          amount_in?: string | null;
          amount_out?: string | null;
          rate?: string | null;
          rate_mode?: string | null;
          payment_reference?: string | null;
          wallet_address?: string | null;
          txn_hash?: string | null;
          incoming_hash?: string | null;
          outgoing_hash?: string | null;
          clearing_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          status?: string | null;
          currency_in?: string | null;
          currency_out?: string | null;
          amount_in?: string | null;
          amount_out?: string | null;
          rate?: string | null;
          rate_mode?: string | null;
          payment_reference?: string | null;
          wallet_address?: string | null;
          txn_hash?: string | null;
          incoming_hash?: string | null;
          outgoing_hash?: string | null;
          clearing_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comms_log: {
        Row: {
          id: string;
          transaction_id: string | null;
          channel: string | null;
          direction: string | null;
          recipient: string | null;
          content: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          transaction_id?: string | null;
          channel?: string | null;
          direction?: string | null;
          recipient?: string | null;
          content?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string | null;
          channel?: string | null;
          direction?: string | null;
          recipient?: string | null;
          content?: string | null;
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
