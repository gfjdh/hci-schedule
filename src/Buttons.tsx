import React, { useState } from "react"
import "./Buttons.css"

interface CustomButtonProps {
  children: React.ReactNode;
  width?: string;
  spacing?: string;
  onClick?: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  width = "80px",
  spacing = "8px",
  onClick,
}) => {
  return (
    <button
      style={{
        width,
        marginRight: spacing,
      }}
      className="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

function Buttons() {
  const [page, setPage] = useState(1);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };
  return (
    <>
      <div className="buttons">
        <span className="configBtn">
          <CustomButton width="8vw">设置</CustomButton>
          <CustomButton width="8vw">帮助</CustomButton> 
        </span>
        <span className="command">
          <CustomButton width="8vw"> 语音输入 </CustomButton>
          <label className="command-label">指令</label>
          <input type="text" className="command-input" placeholder="请输入指令"/>
          <CustomButton width="5vw">执行</CustomButton>
        </span>
        <span className="page">
          当前在第
          <CustomButton width="3vw" spacing="8px" onClick={handlePrevPage}>←</CustomButton>
          <span className="page-number">{page}</span>
          <CustomButton width="3vw" spacing="8px" onClick={handleNextPage}>→</CustomButton>
          页
        </span>
      </div>
    </>
  )
}

export default Buttons
