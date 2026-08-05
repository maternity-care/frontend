import { LegalTab } from "@/app/legal/page";
import GeneralTerms from "./contents/GeneralTerms";
import PrivacyPolicy from "./contents/PrivacyPolicy";
import UserProtection from "./contents/UserProtection";
import Disclaimer from "./contents/Disclaimer";
import ComplaintPolicy from "./contents/ComplaintPolicy";
import PatientRights from "./contents/PatientRights";

interface Props {
  activeTab: LegalTab;
}

export default function LegalContent({ activeTab }: Props) {
  switch (activeTab) {
    case "general":
      return <GeneralTerms />;
    case "privacy":
      return <PrivacyPolicy />;
    case "user-protection":
      return <UserProtection />;
    case "disclaimer":
      return <Disclaimer />;
    case "complaint":
      return <ComplaintPolicy />;
    case "patient-rights":
      return <PatientRights />;
    default:
      return <GeneralTerms />;
  }
}