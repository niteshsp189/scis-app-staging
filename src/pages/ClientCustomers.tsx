import CustomersByStatus from "@/components/customers/CustomersByStatus";

const ClientCustomers = () => {
  return (
    <CustomersByStatus
      status="Client"
      title="Active Customers"
      description="Active customers who can purchase new policies"
      showAddButton={true}
    />
  );
};

export default ClientCustomers;