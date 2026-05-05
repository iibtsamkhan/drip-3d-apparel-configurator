import { SignIn } from "@clerk/clerk-react";
import AuthLayout from "../components/AuthLayout";
import { clerkAppearance } from "../config/clerk";

const SignInPage = () => {
  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Sign in to enter the studio."
      alternateLabel="Need an account?"
      alternateHref="/sign-up">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        forceRedirectUrl="/app"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
};

export default SignInPage;
