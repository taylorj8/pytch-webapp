import { Tabs, TabWithTypedKey } from "./TabWithTypedKey";

const Tab = TabWithTypedKey<"unit">;
type Props = { title: string; children: React.ReactNode };
export const SingleTab: React.FC<Props> = ({ title, children }) => {
  return (
    <Tabs transition={false} activeKey="unit">
      <Tab eventKey="unit" title={title}>
        {children}
      </Tab>
    </Tabs>
  );
};
