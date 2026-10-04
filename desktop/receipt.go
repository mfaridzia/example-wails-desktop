package main

import (
	"fmt"
	"strings"
	"time"
)

const ReceiptWidth = 32

func padCenter(s string, width int) string {
	if len(s) >= width {
		return s[:width]
	}
	left := (width - len(s)) / 2
	right := width - len(s) - left
	return strings.Repeat(" ", left) + s + strings.Repeat(" ", right)
}

func padRow(left, right string, width int) string {
	totalLen := len(left) + len(right)
	if totalLen >= width {
		return left + " " + right
	}
	spaces := width - totalLen
	return left + strings.Repeat(" ", spaces) + right
}

func formatCurrency(val float64) string {
	return fmt.Sprintf("Rp %s", formatNumber(int64(val)))
}

func formatNumber(n int64) string {
	s := fmt.Sprintf("%d", n)
	if len(s) <= 3 {
		return s
	}
	var res []string
	for len(s) > 3 {
		res = append([]string{s[len(s)-3:]}, res...)
		s = s[:len(s)-3]
	}
	if len(s) > 0 {
		res = append([]string{s}, res...)
	}
	return strings.Join(res, ".")
}

func GenerateReceiptText(order Order) string {
	sepDouble := strings.Repeat("=", ReceiptWidth)
	sepSingle := strings.Repeat("-", ReceiptWidth)

	var sb strings.Builder

	// Header
	sb.WriteString("\n")
	sb.WriteString(padCenter("ARTISAN COFFEE & BAKERY", ReceiptWidth) + "\n")
	sb.WriteString(padCenter("Grand Indonesia, West Mall L3", ReceiptWidth) + "\n")
	sb.WriteString(padCenter("Telp: 021-555-8899", ReceiptWidth) + "\n")
	sb.WriteString(sepDouble + "\n")

	// Order Info
	t, err := time.Parse(time.RFC3339, order.CreatedAt)
	dateStr := order.CreatedAt
	if err == nil {
		dateStr = t.Format("02/01/2006 15:04:05")
	}

	sb.WriteString(padRow("Waktu", dateStr, ReceiptWidth) + "\n")
	sb.WriteString(padRow("No. Struk", order.OrderNumber, ReceiptWidth) + "\n")
	sb.WriteString(padRow("Kasir", "Kasir 01 (Senopati)", ReceiptWidth) + "\n")
	if order.CustomerName != "" {
		sb.WriteString(padRow("Pelanggan", order.CustomerName, ReceiptWidth) + "\n")
	}
	sb.WriteString(sepSingle + "\n")

	// Items
	for _, item := range order.Items {
		sb.WriteString(fmt.Sprintf("%-32s\n", item.Name))
		qtyPrice := fmt.Sprintf("%dx %s", item.Quantity, formatCurrency(item.Price))
		sub := formatCurrency(item.Subtotal)
		sb.WriteString(padRow("  "+qtyPrice, sub, ReceiptWidth) + "\n")
	}
	sb.WriteString(sepSingle + "\n")

	// Calculations
	subtotal := order.TotalAmount
	tax := subtotal * 0.10
	grandTotal := subtotal + tax

	sb.WriteString(padRow("Subtotal", formatCurrency(subtotal), ReceiptWidth) + "\n")
	sb.WriteString(padRow("PB1 (10%)", formatCurrency(tax), ReceiptWidth) + "\n")
	sb.WriteString(sepDouble + "\n")
	sb.WriteString(padRow("TOTAL", formatCurrency(grandTotal), ReceiptWidth) + "\n")

	// Payment Details
	sb.WriteString(padRow("Metode Bayar", order.PaymentMethod, ReceiptWidth) + "\n")
	if order.PaymentMethod == "CASH" && order.CashGiven > 0 {
		sb.WriteString(padRow("Tunai Diterima", formatCurrency(order.CashGiven), ReceiptWidth) + "\n")
		sb.WriteString(padRow("Kembalian", formatCurrency(order.ChangeDue), ReceiptWidth) + "\n")
	}
	sb.WriteString(sepDouble + "\n")

	// Footer
	sb.WriteString(padCenter("TERIMA KASIH ATAS KUNJUNGANNYA", ReceiptWidth) + "\n")
	sb.WriteString(padCenter("WiFi: ArtisanCafe / Pass: kopienak", ReceiptWidth) + "\n")
	sb.WriteString(padCenter("Instagram: @artisancafe.id", ReceiptWidth) + "\n")
	sb.WriteString(padCenter("[ * * * * * * * * * ]", ReceiptWidth) + "\n")
	sb.WriteString(padCenter(order.ID, ReceiptWidth) + "\n")
	sb.WriteString("\n\n")

	return sb.String()
}
