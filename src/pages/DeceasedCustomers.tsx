import CustomersByStatus from "@/components/customers/CustomersByStatus";

const DeceasedCustomers = () => {
  return (
    <CustomersByStatus
      status="Deceased"
      title="Deceased Customers"
      description="Customers who have passed away"
      showAddButton={false}
    />
  );
};

export default DeceasedCustomers;