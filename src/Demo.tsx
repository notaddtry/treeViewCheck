import * as React from "react";
import { useDrop, useDrag, DragSourceMonitor, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { /*TreeItem,*/ TreeView, TreeItemProps } from "@mui/lab";
import TreeItem from "./TreeItem";

interface DragItem {
  index: number;
}

interface DraggableTreeItemProps extends TreeItemProps {
  index: number;
  moveItem: (from: number, to: number) => void;
}

const DraggableTreeItem = React.forwardRef<
  HTMLLIElement,
  DraggableTreeItemProps
>(({ index, moveItem, ...props }, outerRef) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: "item",

    canDrop: () => false,

    hover(item: DragItem) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      moveItem(dragIndex, hoverIndex);

      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: "item",
    item: {
      index: index
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(drop(ref));

  return (
    <TreeItem
      ref={ref}
      style={{
        ...props.style,
        opacity: isDragging ? 0 : 1
      }}
      {...props}
    />
  );
});

/**
 * how you used the components
 */
export default function Demo() {
  const [items, setItems] = React.useState(["Item 1", "Item 2", "Item 3"]);

  const moveItem = (from: number, to: number) => {
    setItems((items) => {
      const newItems = [...items];

      newItems.splice(to, 0, ...newItems.splice(from, 1));

      return newItems;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <TreeView>
        {items.map((item, index) => (
          <DraggableTreeItem
            key={item}
            nodeId={item}
            label={item}
            index={index}
            moveItem={moveItem}
          />
        ))}
      </TreeView>
    </DndProvider>
  );
}
