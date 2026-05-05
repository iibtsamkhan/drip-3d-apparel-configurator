import { SignUp } from "@clerk/clerk-react";
import AuthLayout from "../components/AuthLayout";
import { clerkAppearance } from "../config/clerk";

const SignUpPage = () => {
  return (
    <AuthLayout
      eyebrow="Create Your Account"
      title="Join Drip3D and start designing."
      alternateLabel="Already have an account?"
      alternateHref="/sign-in">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/app"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
};

export default SignUpPage;
