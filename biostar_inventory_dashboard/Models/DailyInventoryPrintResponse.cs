namespace biostar_inventory_dashboard.Models
    {
        public class DailyInventoryPrintResponse
        {
            public string FromDate { get; set; } = "";
            public string ToDate { get; set; } = "";
            public string Warehouse { get; set; } = "";

            public List<DailyInventoryPrintRow> Data { get; set; } = new();
        }

        public class DailyInventoryPrintRow
        {
            public string ProductId { get; set; } = "";
            public string ProductName { get; set; } = "";
            public string ProductDescription { get; set; } = "";
            public string CategoryName { get; set; } = "";

            public string BranchId { get; set; } = "";
            public string BranchName { get; set; } = "";

            public string Uom { get; set; } = "";
            public string PackUom { get; set; } = "";
            public decimal PackQty { get; set; }

            public decimal Opening { get; set; }
            public decimal ProductionIn { get; set; }
            public decimal StockOut { get; set; }
            public decimal AdjustmentIn { get; set; }
            public decimal AdjustmentOut { get; set; }
            public decimal TransferIn { get; set; }
            public decimal TransferOut { get; set; }
            public decimal OtherIn { get; set; }
            public decimal OtherOut { get; set; }

            public decimal Received { get; set; }
            public decimal Released { get; set; }
            public decimal Closing { get; set; }

            public List<DailyInventoryTransactionRow> Transactions { get; set; }
                = new();
        }

        public class DailyInventoryTransactionRow
        {
        public long TransactionId { get; set; }
        public DateTime Date { get; set; }
            public string Type { get; set; } = "";
            public string ReferenceType { get; set; } = "";
            public string Category { get; set; } = "";
            public string LotNo { get; set; } = "";

            public decimal Quantity { get; set; }

            public string? TransmittalNo { get; set; }
            public string? DeliveryReceiptNo { get; set; }
            public string? InvoiceNo { get; set; }
            public string? PurchaseOrderNo { get; set; }
            public string? ChecklistNo { get; set; }
            public string? OrderNo { get; set; }
            public string? Remarks { get; set; }
        }
    }

