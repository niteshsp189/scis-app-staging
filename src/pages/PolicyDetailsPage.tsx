import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PolicyService } from "@/services/policyService";
import { Policy } from "@/types/policy";
import { Skeleton } from "@/components/ui/skeleton";
import { PolicyDetailPage } from "@/components/policy/PolicyDetailPage";

const PolicyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const policyId = Number(id);

  const { data: policy, isLoading, error } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      if (!policyId || isNaN(policyId)) throw new Error("Invalid policy id");
      const resp = await PolicyService.getPolicy(policyId);
      return resp.data as Policy;
    },
    enabled: !!policyId,
    onError: (err: any) => {
      console.error("Failed to load policy:", err);
    }
  });

  if (!id) {
    return <div className="p-6">Invalid policy id</div>;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-72 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Policy not found</h2>
        <p className="text-sm text-gray-500">Unable to load policy details.</p>
        <div className="mt-4">
          <button
            className="btn"
            onClick={() => navigate("/policies")}
          >
            Back to policies
          </button>
        </div>
      </div>
    );
  }

  return (
    <PolicyDetailPage policy={policy} />
  );
};

export default PolicyDetailsPage;
