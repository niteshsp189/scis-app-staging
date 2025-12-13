import CustomersByStatus from "@/components/customers/CustomersByStatus";

const FormerCustomers = () => {
  return (
    <CustomersByStatus
      status="Former"
      title="Former Customers"
      description="Inactive customers who cannot purchase new policies"
      showAddButton={false}
    />
  );
};

export default FormerCustomers;