import React from 'react';
import { 
  HiViewList, 
  HiViewGrid, 
  HiCalendar, 
  HiChartBar,
  HiTemplate
} from 'react-icons/hi';

export const taskViewTypes = [
  {
    name: 'List',
    key: 'list',
    icon: <HiViewList size={16} />,
  },
  {
    name: 'Kanban',
    key: 'kanban', 
    icon: <HiTemplate size={16} />,
  },
  {
    name: 'Calendar',
    key: 'calendar',
    icon: <HiCalendar size={16} />,
  },
  {
    name: 'Gantt',
    key: 'gantt',
    icon: <HiChartBar size={16} />,
  },
  // {
  //   name: 'Grid',
  //   key: 'grid',
  //   icon: <HiViewGrid size={16} />,
  // },
];

export default taskViewTypes;
