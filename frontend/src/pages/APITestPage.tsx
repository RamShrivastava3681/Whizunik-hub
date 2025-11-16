import { APIConnectionTester } from "@/components/APIConnectionTester";

const APITestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <APIConnectionTester />
      </div>
    </div>
  );
};

export default APITestPage;