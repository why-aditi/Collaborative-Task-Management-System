import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Flag as FlagIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';

const TaskBoard = ({ projectId, onStatusChange }) => {
  const [columns, setColumns] = useState({
    'To-Do': [],
    'In Progress': [],
    'Completed': [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped in its original location
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Call the status update function with the task ID and new status
    onStatusChange(draggableId, destination.droppableId);
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

  if (loading) {
    return <Typography>Loading task board...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Grid container spacing={2}>
        {Object.entries(columns).map(([status, statusTasks]) => (
          <Grid item xs={12} md={4} key={status}>
            <Paper
              sx={{
                p: 2,
                bgcolor: theme => 
                  status === 'To-Do' ? theme.palette.grey[100] :
                  status === 'In Progress' ? theme.palette.primary.light :
                  theme.palette.success.light,
                minHeight: 400
              }}
            >
              <Typography variant="h6" gutterBottom>
                {status} ({statusTasks.length})
              </Typography>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      minHeight: 100,
                      bgcolor: snapshot.isDraggingOver ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                      transition: 'background-color 0.2s ease',
                      borderRadius: 1
                    }}
                  >
                    {statusTasks.map((task, index) => (
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
                              transform: snapshot.isDragging ? 'rotate(3deg)' : 'none',
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {task.title}
                              </Typography>
                              <Box sx={{ mb: 1 }}>
                                <Chip
                                  icon={<FlagIcon />}
                                  label={task.priority}
                                  color={getPriorityColor(task.priority)}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                                <Typography variant="body2" color="text.secondary">
                                  {task.assignee?.name}
                                </Typography>
                              </Box>
                            </CardContent>
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