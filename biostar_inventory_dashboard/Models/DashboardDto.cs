namespace biostar_inventory_dashboard.Models
{
    public class DashboardDto
    {
        public int DailyOrders { get; set; }
        public int ReadyForChecklist { get; set; }
        public int ChecklistQueue { get; set; }
        public int ReleasedToday { get; set; }
        public int PartialDispatch { get; set; }
        public int LowStock { get; set; }
        public int CompletedOrders { get; set; }

        public List<DashboardChecklistDto> Checklist { get; set; } = new();
        public List<DashboardPartialOrderDto> PartialOrders { get; set; } = new();
        public List<DashboardInventoryAlertDto> InventoryAlerts { get; set; } = new();
        public List<DashboardTransactionDto> RecentTransactions { get; set; } = new();
        public List<DashboardReturnDto> RecentReturns { get; set; } = new();
    }

    public class DashboardChecklistDto
    {
        public long ChecklistId { get; set; }
        public string ChecklistNo { get; set; } = "";
        public DateTime? DeliveryDate { get; set; }
        public string TruckName { get; set; } = "";
        public string DriverName { get; set; } = "";
        public string Status { get; set; } = "";
    }

    public class DashboardPartialOrderDto
    {
        public long OrderId { get; set; }
        public string OrderNo { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public decimal RemainingQty { get; set; }
        public string Status { get; set; } = "";
    }

    public class DashboardInventoryAlertDto
    {
        public string ProductId { get; set; } = "";
        public string ProductName { get; set; } = "";

        public decimal Quantity { get; set; }        // for LOW STOCK
        public decimal StockLevel { get; set; }      // KEEP THIS (you said)

        public decimal AvailableQty { get; set; }    // NEW
        public decimal RequiredQty { get; set; }     // NEW
        public decimal ShortageQty { get; set; }     // NEW
        public decimal ReservedQty { get; set; }

        public string Uom { get; set; } = "";
        public string AlertType { get; set; } = "";
    }

    public class DashboardTransactionDto
    {
        public DateTime TransactionDate { get; set; }
        public string ReferenceNo { get; set; } = "";

        public string CustomerName { get; set; } = "";
        public string DrNo { get; set; } = "";
        public string InvNo { get; set; } = "";
        public string PoNo { get; set; } = "";
        public string OrderNo { get; set; } = "";
        public string ChecklistNo { get; set; } = "";
        public string LotNo { get; set; } = "";
        public string ProductName { get; set; } = "";
        public decimal Quantity { get; set; }
        public string Uom { get; set; } = "";
        public string Type { get; set; } = "";
        public string? Remarks { get; set; }
    }

    public class DashboardReturnDto
    {
        public string ReturnNo { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public decimal Quantity { get; set; }
        public string Reason { get; set; } = "";
        public string Status { get; set; } = "";
        public string? QuarantineLocation { get; set; }
        public DateTime? ReturnDate { get; set; }
    }
}