import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GetPaymentHistoryRequest {
  externalUserId: string;
  page?: number;
  pageSize?: number;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GetPaymentHistoryRequest = await req.json();
    const { externalUserId, page = 1, pageSize = 10 } = body;

    if (!externalUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all records for summary calculation
    const { data: allRecords, error: summaryError } = await supabase
      .from('payment_records')
      .select('amount, status')
      .eq('external_user_id', externalUserId);

    if (summaryError) {
      console.error('Failed to fetch payment summary:', summaryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch payment history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate summary statistics
    const totalRecords = allRecords?.length || 0;
    const totalAmount = allRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    const statusBreakdown: Record<string, { count: number; amount: number }> = {};
    
    allRecords?.forEach((record) => {
      if (!statusBreakdown[record.status]) {
        statusBreakdown[record.status] = { count: 0, amount: 0 };
      }
      statusBreakdown[record.status].count += 1;
      statusBreakdown[record.status].amount += Number(record.amount);
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalRecords / pageSize);
    const offset = (page - 1) * pageSize;

    const { data, error } = await supabase
      .from('payment_records')
      .select('id, payment_id, amount, memo, status, txid, created_at')
      .eq('external_user_id', externalUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Failed to fetch payment history:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch payment history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages,
        },
        summary: {
          totalPayments: totalRecords,
          totalAmount,
          statusBreakdown,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment history error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
