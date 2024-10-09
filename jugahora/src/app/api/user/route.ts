import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: Request) {
    // Create Supabase client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authentication cookie
    const cookieStore = cookies();
    const token = cookieStore.get('token');
    console.log('Token received:', token?.value);

    // Check if token exists
    if (!token) {
        console.error('Token not found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Decode the token to get the email (assumes the token contains the email)
        const payload = JSON.parse(Buffer.from(token.value.split('.')[1], 'base64').toString());
        const userEmail = payload.email;
        console.log('Email extracted from token:', userEmail);

        // If no email found, return unauthorized
        if (!userEmail) {
            console.error('Email not found in token payload');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse the request body for update data
        const updatedData = await request.json();
        console.log('Data to update:', updatedData);

        // Try to update the user's profile in public.User table
        const { data, error: updateError } = await supabase
            .from('User') // Make sure this matches the actual table name
            .update({
                first_name: updatedData.firstName,
                last_name: updatedData.lastName,
                phone_number: updatedData.phoneNumber,
                address: updatedData.address,
                age: updatedData.age,
            })
            .eq('email', userEmail); // Use email from token

        // Log the update response
        console.log('Update result:', data);
        if (updateError) {
            console.error('Error updating profile:', updateError.message);
            return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
        }

        // Successful response
        return NextResponse.json({ message: 'Profile updated successfully', updatedUser: data });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
