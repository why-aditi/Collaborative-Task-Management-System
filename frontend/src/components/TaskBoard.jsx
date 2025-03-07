import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Flag as FlagIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TaskBoard = ({ projectId }) => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState({
    'To-Do': [],
    'In Progress': [],
    'Completed': [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tasks/project/${projectId}`);
      const tasks = response.data;

      // Group tasks by status
      const groupedTasks = {
        'To-Do': tasks.filter(task => task.status === 'To-Do'),
        'In Progress': tasks.filter(task => task.status === 'In Progress'),
        'Completed': tasks.filter(task => task.status === 'Completed'),
      };

      setColumns(groupedTasks);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // No change in position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Update task status in backend
    try {
      await axios.patch(`/api/tasks/${draggableId}/status`, {
        status: destination.droppableId,
      });

      // Update local state
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const [movedTask] = sourceColumn.splice(source.index, 1);
      movedTask.status = destination.droppableId;
      destColumn.splice(destination.index, 0, movedTask);

      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn,
      });
    } catch (err) {
      setError('Failed to update task status');
      console.error(err);
      // Revert changes on error
      fetchTasks();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getColumnColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#e8f5e9';
      case 'In Progress':
        return '#e3f2fd';
      default:
        return '#f5f5f5';
    }
  };

  if (loading) {
    return <Typography>Loading task board...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Grid container spacing={2}>
        {Object.entries(columns).map(([status, tasks]) => (
          <Grid item xs={12} md={4} key={status}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: getColumnColor(status),
                height: '100%',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {status} ({tasks.length})
              </Typography>
              <Droppable droppableId={status}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ minHeight: 100 }}
                  >
                    {tasks.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 1,
                              backgroundColor: snapshot.isDragging
                                ? 'action.hover'
                                : 'background.paper',
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {task.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                sx={{ mb: 1 }}
                              >
                                {task.description}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  size="small"
                                  icon={<FlagIcon />}
                                  label={task.priority}
                                  color={getPriorityColor(task.priority)}
                                />
                                <Box display="flex" alignItems="center">
                                  <Avatar
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                  >
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2">
                                    {task.assignee.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                            <CardActions>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/projects/${projectId}/tasks/${task._id}`)
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </CardActions>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </DragDropContext>
  );
};

export default TaskBoard; 