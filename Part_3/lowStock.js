import model from


// Assuming: thresholds = { [product_id]: number }
const THRESHOLDS = {
    1: 20,  // product_id: threshold
    2: 50,
    3: 10,
};

router.get('/api/companies/:company_id/alerts/low-stock', async (req, res) => {
    const { company_id } = req.params;
    const client = await pool.connect(); // assuming `pool` is from `pg` module

    try {
        // Fetch products in warehouses of this company with stock below threshold
        const result = await client.query(`
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        i.qty AS current_stock,
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.company_id,
        s.contact_email,
        (
          SELECT SUM(change) / 30.0
          FROM inventory_history ih
          WHERE ih.product_id = p.id
            AND ih.warehouse_id = w.id
            AND ih.change < 0
            AND ih.occurred_at >= NOW() - INTERVAL '30 days'
        ) AS daily_sales
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      JOIN warehouses w ON w.id = i.warehouse_id
      JOIN companies c ON c.id = w.company_id
      LEFT JOIN product_suppliers ps ON ps.product_id = p.id
      LEFT JOIN suppliers s ON s.id = ps.supplier_id
      WHERE w.company_id = $1
    `, [company_id]);

        //  Filter for threshold + recent sales
        const alerts = result.rows
            .map(row => {
                const threshold = THRESHOLDS[row.product_id] || 10; // default threshold
                const hasSales = row.daily_sales && row.daily_sales > 0;
                const belowThreshold = row.current_stock < threshold;
                
                //Checking the conditions
                if (belowThreshold && hasSales) {
                    return {
                        product_id: row.product_id,
                        product_name: row.product_name,
                        sku: row.sku,
                        warehouse_id: row.warehouse_id,
                        warehouse_name: row.warehouse_name,
                        current_stock: row.current_stock,
                        threshold,
                        days_until_stockout: row.daily_sales > 0
                            ? Math.floor(row.current_stock / row.daily_sales)
                            : null,
                        supplier: row.supplier_id ? {
                            id: row.supplier_id,
                            name: row.supplier_name,
                            contact_email: row.contact_email || null
                        } : null
                    };
                }

                return null;
            })
            .filter(Boolean);

        res.json({ alerts, total_alerts: alerts.length });

    // Respond with Error handling
    } catch (err) {
        console.error('Error generating low-stock alerts:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});
