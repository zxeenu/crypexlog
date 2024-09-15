import { PropsWithChildren, createContext, useState } from "react";

const NavBarContext = createContext<
  | {
      setTab: (value: string) => void;
      getTab: () => string;
    }
  | undefined
>(undefined);

type Props = PropsWithChildren<{}>;

const NavBarProvider = ({ children }: Props) => {
  const [data, setData] = useState<string>("");

  const setTab = (value: string) => {
    setData(() => value);
  };

  const getTab = () => {
    return data;
  };

  return (
    <NavBarContext.Provider value={{ setTab, getTab }}>
      {children}
    </NavBarContext.Provider>
  );
};

export { NavBarContext, NavBarProvider };
