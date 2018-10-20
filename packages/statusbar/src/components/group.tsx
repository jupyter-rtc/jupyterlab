/**
 * @ignore
 */
import * as React from 'react';
import { style, classes } from 'typestyle/lib';
import { centeredFlex, leftToRight } from '../style/layout';

const groupItemLayout = style(centeredFlex, leftToRight);

// tslint:disable-next-line:variable-name
export const GroupItem = (
  props: GroupItem.IProps & React.HTMLAttributes<HTMLDivElement>
): React.ReactElement<GroupItem.IProps> => {
  const { spacing, children, className, ...rest } = props;
  const numChildren = React.Children.count(children);

  return (
    <div className={classes(groupItemLayout, className)} {...rest}>
      {React.Children.map(children, (child, i) => {
        if (i === 0) {
          return <div style={{ marginRight: `${spacing}px` }}>{child}</div>;
        } else if (i === numChildren - 1) {
          return <div style={{ marginLeft: `${spacing}px` }}>{child}</div>;
        } else {
          return <div style={{ margin: `0px ${spacing}px` }}>{child}</div>;
        }
      })}
    </div>
  );
};

export namespace GroupItem {
  export interface IProps {
    spacing: number;
    children: JSX.Element[];
  }
}