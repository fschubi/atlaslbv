import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const ViewKanbanIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props}>
      <path d="M2,4h6v10h-6v-10Zm8,0h6v6h-6v-6Zm8,0h4v16h-4v-16Zm-8,8h6v8h-6v-8Z" />
    </SvgIcon>
  );
};

export default ViewKanbanIcon;
