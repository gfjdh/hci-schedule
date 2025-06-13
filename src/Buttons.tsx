import "./Buttons.css"

interface CustomButtonProps {
  children: React.ReactNode;
  width?: string;
  spacing?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const CustomButton = ({
  children,
  width = "80px",
  spacing = "8px",
  onClick,
  style,
}: CustomButtonProps) => {
  return (
    <button
      style={{
        width,
        marginRight: spacing,
        ...style,
      }}
      className="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

function Buttons() {
  return (
    <>
    <div className="buttons">
      <span className="configBtn">
        <CustomButton width="8vw">🏠主页</CustomButton>
        <CustomButton width="8vw">⚙设置</CustomButton>
        <CustomButton width="8vw">❓帮助</CustomButton>
      </span>
    </div>
  </>
  )
}

export default Buttons
