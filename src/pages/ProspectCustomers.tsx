import CustomersByStatus from "@/components/customers/CustomersByStatus";

const ProspectCustomers = () => {
  return (
    <CustomersByStatus
      status="Prospect"
      title="Prospects Customers"
      description="Potential customers who haven't been converted to active clients yet"
      showAddButton={true}
    />
  );
};

export default ProspectCustomers;
