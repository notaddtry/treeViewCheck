import { useDrag, useDrop, DndProvider, DropTargetMonitor } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { TreeItem, TreeItemProps, TreeView, TreeViewProps } from '@mui/lab'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box } from '@mui/material'
import React from 'react'

// pulled from react-merge-refs
function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }
}

// type RenderStaticNodeProps = {
//   item: Item
// }

// const RenderStaticNode = ({ item }: RenderStaticNodeProps) => {
//   return (
//     <TreeItem key={item.id} nodeId={item.id} label={`Item ${item.id}`}>
//       {item.children && item.children?.length > 0
//         ? item.children.map((childItem, index) => (
//             <RenderStaticNode key={childItem.id} item={childItem} />
//           ))
//         : null}
//     </TreeItem>
//   )
// }

type RenderDraggableNodeProps = {
  onDrop: any
  item: Item
}

const RenderDraggableNode = ({ item, onDrop }: RenderDraggableNodeProps) => {
  const ref = useRef<HTMLDivElement>(null)
  // rgba(22, 52, 71, 0.08)
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }))
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: 'item',
    drop(droppedItem: Item, monitor) {
      const didDrop = monitor.didDrop()

      if (didDrop) {
        return
      }
      onDrop(droppedItem, item)
    },
    canDrop(itemToDrop: Item, monitor: DropTargetMonitor) {
      if (itemToDrop.id === item.id) {
        return false
      }
      return true
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }))

  useEffect(() => {
    const focusInEvent = (e: FocusEvent) => {
      e.stopImmediatePropagation()
    }

    ref.current?.addEventListener('focusin', focusInEvent)
    drag(ref.current)

    return () => {
      ref.current?.removeEventListener('focusin', focusInEvent)
    }
  }, [drag])

  const isActive = canDrop && isOverCurrent
  return (
    <TreeItem
      ref={mergeRefs([drag, drop, dragPreview, ref])}
      key={item.id}
      nodeId={item.id}
      label={`Item ${item.id}`}
      sx={{
        backgroundColor: isActive ? 'red' : 'unset',
      }}
    >
      {isDragging
        ? null
        : item.children && item.children?.length > 0
        ? item.children.map((childItem, index) => (
            <RenderDraggableNode
              onDrop={onDrop}
              key={childItem.id}
              item={childItem}
            />
          ))
        : null}
    </TreeItem>
  )
}

function mapTree(items: Item[], key: string) {
  const tempItems = items.map((item, index) => {
    return {
      ...item,
      children: [] as Item[],
    }
  })
  const map: Record<string, number> = {}
  let node: Item
  const roots: Item[] = []
  let i
  for (i = 0; i < tempItems.length; i += 1) {
    map[tempItems[i].id] = i // initialize the map
  }
  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i]
    if (node[key] && tempItems[map[node[key]]]) {
      // if you have dangling branches check that map[node.parentId] exists
      tempItems[map[node[key]]].children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

type TreeRootProps = TreeViewProps & {
  setNodes: (value: React.SetStateAction<Item[]>) => void
}

const TreeRoot = ({ children, setNodes, ...rest }: TreeRootProps) => {
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    type: rest,
    accept: 'item',
    drop(item: Item, monitor) {
      const didDrop = monitor.didDrop()
      if (didDrop || !item.parentId) {
        return
      }
      setNodes((stateNodes) =>
        stateNodes.map((stateNode) => {
          if (stateNode.id === item.id) {
            return {
              ...stateNode,
              parentId: null,
            }
          } else {
            return stateNode
          }
        })
      )
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }))
  const isActive = canDrop && isOverCurrent
  return (
    <div
      ref={drop}
      style={{
        height: '100%',
        backgroundColor: isActive ? 'rgba(22, 52, 71, 0.08)' : 'unset',
      }}
    >
      <TreeView {...rest}>{children}</TreeView>
    </div>
  )
}

type Item = {
  id: string
  disabled: boolean
  parentId: string | null
  children?: Item[]
}

const ItemsTree = () => {
  const [nodes, setNodes] = useState<Item[]>([
    { id: '0', disabled: false, parentId: null },
    { id: '1', disabled: false, parentId: '0' },
    { id: '2', disabled: false, parentId: '0' },
    { id: '3', disabled: false, parentId: '0' },
    { id: '4', disabled: false, parentId: '2' },
    { id: '5', disabled: false, parentId: '2' },
    { id: '6', disabled: false, parentId: '2' },
    { id: '7', disabled: false, parentId: '6' },
    { id: '8', disabled: false, parentId: '7' },
    { id: '9', disabled: false, parentId: null },
    { id: '10', disabled: true, parentId: null },
  ])
  const mappedItems = useMemo<Item[]>(() => mapTree(nodes, 'parentId'), [nodes])
  const onDrop = (droppedItem: Item, containerItem: Item) => {
    setNodes((stateNodes) =>
      stateNodes.map((stateNode) => {
        if (stateNode.id === droppedItem.id) {
          return {
            ...stateNode,
            parentId: containerItem.id,
          }
        } else {
          return stateNode
        }
      })
    )
  }
  return (
    <Box sx={{ height: '100vh', width: '100vw' }}>
      <DndProvider backend={HTML5Backend}>
        <TreeRoot
          setNodes={setNodes}
          defaultExpanded={nodes
            .filter((item) => item.disabled)
            .map((item) => item.id)}
          defaultSelected={nodes
            .filter((item) => item.disabled)
            .map((item) => item.id)}
          aria-label="items navigator"
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          sx={{ height: '100%', flexGrow: 1, width: '100%', overflowY: 'auto' }}
        >
          {mappedItems.map((item, index) => (
            <RenderDraggableNode key={item.id} item={item} onDrop={onDrop} />
          ))}
        </TreeRoot>
      </DndProvider>
    </Box>
  )
}

export default ItemsTree
