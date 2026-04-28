import { useInventory } from '../hooks/useInventory';
function InventoryPage() {
    const { data, loading, error } = useInventory();
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <>
            <h2>Inventory</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
    )
}

export default InventoryPage;