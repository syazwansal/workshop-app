import BrandHeader from "@/components/BrandHeader";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
      <BrandHeader />
      <LoginForm confirmError={error === "confirm"} />
    </div>
  );
}
