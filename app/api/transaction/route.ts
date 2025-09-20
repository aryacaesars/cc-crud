import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET - Mengambil semua transaksi atau transaksi berdasarkan query parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    // Build filter object
    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Membuat transaksi baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, amount, description } = body;

    // Validasi input
    if (!type || !category || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, category, and amount are required',
        },
        { status: 400 }
      );
    }

    // Validasi type
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be either "income" or "expense"',
        },
        { status: 400 }
      );
    }

    // Validasi amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be a positive number',
        },
        { status: 400 }
      );
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount,
        description: description || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newTransaction,
        message: 'Transaction created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

// PUT - Mengupdate transaksi (memerlukan ID di query parameter)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, category, amount, description } = body;

    // Validasi type jika disediakan
    if (type && !['income', 'expense'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be either "income" or "expense"',
        },
        { status: 400 }
      );
    }

    // Validasi amount jika disediakan
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be a positive number',
        },
        { status: 400 }
      );
    }

    // Build update object (hanya field yang disediakan)
    const updateData: any = {};
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;

    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE - Menghapus transaksi (memerlukan ID di query parameter)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
