import drip3dLogo from "../assets/drip3d-logo.png";

const Drip3DLogo = ({ className = "", title = "Drip3D" }) => {
  return <img src={drip3dLogo} alt={title} className={className} />;
};

export default Drip3DLogo;
