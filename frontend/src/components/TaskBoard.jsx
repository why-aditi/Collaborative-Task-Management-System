import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  TextField,
  InputAdornment,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Flag as FlagIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskEditDialog from './TaskEditDialog';

const TaskBoard = ({ projectId, onStatusChange }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState({
    'To-Do': [],
    'In Progress': [],
    'Completed': [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [createNewTask, setCreateNewTask] = useState(false);
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(true);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isProjectManager, setIsProjectManager] = useState(false);

  // Filter tasks based on search term, priority, and user permissions
  const filterTasks = useCallback((tasks) => {
    return tasks.filter(task => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by priority
      const matchesPriority = !filterPriority || task.priority === filterPriority;
      
      // Filter by user assignment (if showOnlyMyTasks is true)
      const matchesUser = !showOnlyMyTasks || 
        task.assignee?._id === user?._id || 
        task.reporter?._id === user?._id ||
        isProjectOwner || 
        isProjectManager;
      
      return matchesSearch && matchesPriority && matchesUser;
    });
  }, [searchTerm, filterPriority, showOnlyMyTasks, user?._id, isProjectOwner, isProjectManager]);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`);
      const project = response.data;
      
      // Check if the current user is the project owner
      setIsProjectOwner(project.owner?._id === user?._id);
      
      // Check if the current user is a project manager
      setIsProjectManager(
        project.members?.some(member => 
          member.user?._id === user?._id && 
          (member.role === 'Manager' || member.role === 'Admin')
        )
      );
    } catch (err) {
      console.error('Error fetching project details:', err);
    }
  }, [projectId, user?._id]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tasks/project/${projectId}`);
      const tasks = response.data;
      setAllTasks(tasks);
      
      // Apply filters
      const filteredTasks = filterTasks(tasks);
      
      // Group tasks by status
      const groupedTasks = {
        'To-Do': filteredTasks.filter(task => task.status === 'To-Do'),
        'In Progress': filteredTasks.filter(task => task.status === 'In Progress'),
        'Completed': filteredTasks.filter(task => task.status === 'Completed'),
      };

      setColumns(groupedTasks);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filterTasks]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Update columns when filters change
  useEffect(() => {
    if (allTasks.length > 0) {
      const filteredTasks = filterTasks(allTasks);
      
      setColumns({
        'To-Do': filteredTasks.filter(task => task.status === 'To-Do'),
        'In Progress': filteredTasks.filter(task => task.status === 'In Progress'),
        'Completed': filteredTasks.filter(task => task.status === 'Completed'),
      });
    }
  }, [searchTerm, filterPriority, showOnlyMyTasks, filterTasks, allTasks]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Check if user has permission to update this task
    const task = allTasks.find(t => t._id === draggableId);
    if (!canEditTask(task)) {
      console.error('Permission denied: You can only update your own tasks');
      return;
    }

    onStatusChange(draggableId, destination.droppableId);
  };

  const canEditTask = (task) => {
    // For debugging
    console.log('Task:', task);
    console.log('User ID:', user?._id);
    console.log('Assignee ID:', task.assignee?._id);
    console.log('Reporter ID:', task.reporter?._id);
    console.log('Is Project Owner:', isProjectOwner);
    console.log('Is Project Manager:', isProjectManager);
    
    // Allow edit if user is the assignee, reporter, project owner, or project manager
    const canEdit = task.assignee?._id === user?._id || 
           task.reporter?._id === user?._id || 
           isProjectOwner || 
           isProjectManager;
           
    console.log('Can Edit:', canEdit);
    
    // For now, always return true to make sure the edit button is visible
    return true;
  };

  const handleTaskUpdated = (updatedTask) => {
    console.log('Task updated:', updatedTask);
    // Update the task in the list
    setAllTasks(prev => {
      const newTasks = prev.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      );
      return newTasks;
    });
    // Close the edit dialog
    setEditTask(null);
    // Refresh tasks to ensure we have the latest data
    fetchTasks();
  };

  const handleCreateTask = (newTask) => {
    console.log('New task created:', newTask);
    // Add the new task to the list
    setAllTasks(prev => [...prev, newTask]);
    // Close the create task dialog
    setCreateNewTask(false);
    // Refresh tasks to ensure we have the latest data
    fetchTasks();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const togglePriorityFilter = (priority) => {
    setFilterPriority(prev => prev === priority ? null : priority);
  };

  const clearFilters = () => {
    setFilterPriority(null);
    setSearchTerm('');
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
      case 'To-Do':
        return 'rgba(240, 240, 240, 0.9)';
      case 'In Progress':
        return 'rgba(227, 242, 253, 0.9)';
      case 'Completed':
        return 'rgba(232, 245, 233, 0.9)';
      default:
        return 'rgba(240, 240, 240, 0.9)';
    }
  };

  const hasActiveFilters = searchTerm || filterPriority || showOnlyMyTasks;

  if (loading && !allTasks.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !allTasks.length) {
    return (
      <Typography color="error" align="center" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2 
        }}>
          <TextField
            placeholder="Search tasks..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyMyTasks}
                  onChange={(e) => setShowOnlyMyTasks(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">My Tasks Only</Typography>
                </Box>
              }
            />
            
            <Button
              variant={filterPriority === 'High' ? 'contained' : 'outlined'}
              color="error"
              size="small"
              onClick={() => togglePriorityFilter('High')}
              sx={{ borderRadius: 2 }}
            >
              High
            </Button>
            <Button
              variant={filterPriority === 'Medium' ? 'contained' : 'outlined'}
              color="warning"
              size="small"
              onClick={() => togglePriorityFilter('Medium')}
              sx={{ borderRadius: 2 }}
            >
              Medium
            </Button>
            <Button
              variant={filterPriority === 'Low' ? 'contained' : 'outlined'}
              color="success"
              size="small"
              onClick={() => togglePriorityFilter('Low')}
              sx={{ borderRadius: 2 }}
            >
              Low
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ borderRadius: 2, ml: 1 }}
              >
                Clear
              </Button>
            )}
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateNewTask(true)}
              sx={{ borderRadius: 2, ml: 1 }}
            >
              New Task
            </Button>
          </Box>
        </Box>
        
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {searchTerm && (
              <Chip 
                label={`Search: "${searchTerm}"`} 
                onDelete={() => setSearchTerm('')}
                size="small"
              />
            )}
            {filterPriority && (
              <Chip 
                icon={<FlagIcon />}
                label={`Priority: ${filterPriority}`}
                onDelete={() => setFilterPriority(null)}
                color={getPriorityColor(filterPriority)}
                size="small"
              />
            )}
          </Box>
        )}
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {Object.entries(columns).map(([status, statusTasks]) => (
            <Grid item xs={12} md={4} key={status}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  bgcolor: getColumnColor(status),
                  minHeight: 400,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                    borderBottom: '2px solid rgba(0,0,0,0.1)'
                  }}
                >
                  {status} 
                  <Chip 
                    label={statusTasks.length} 
                    size="small" 
                    color={
                      status === 'To-Do' ? 'default' : 
                      status === 'In Progress' ? 'primary' : 
                      'success'
                    }
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: 100,
                        bgcolor: snapshot.isDraggingOver ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                        transition: 'background-color 0.2s ease',
                        borderRadius: 1,
                        pt: 1
                      }}
                    >
                      {statusTasks.length === 0 && !loading && (
                        <Box sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          color: 'text.secondary',
                          bgcolor: 'rgba(0,0,0,0.02)',
                          borderRadius: 1,
                          border: '1px dashed rgba(0,0,0,0.1)',
                          mt: 1
                        }}>
                          <Typography variant="body2">
                            No tasks in this column
                          </Typography>
                        </Box>
                      )}
                      
                      {statusTasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                          isDragDisabled={!canEditTask(task)}
                        >
                          {(provided, snapshot) => (
                            <Fade in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  mb: 1.5,
                                  transform: snapshot.isDragging ? 'rotate(3deg) scale(1.02)' : 'none',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                  '&:hover': {
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                                  },
                                  boxShadow: snapshot.isDragging 
                                    ? '0 8px 20px rgba(0,0,0,0.2)' 
                                    : '0 2px 8px rgba(0,0,0,0.08)',
                                  borderLeft: `4px solid ${
                                    task.priority === 'High' ? '#f44336' : 
                                    task.priority === 'Medium' ? '#ff9800' : 
                                    '#4caf50'
                                  }`,
                                  opacity: canEditTask(task) ? 1 : 0.7,
                                }}
                              >
                                <CardContent sx={{ pb: 1 }}>
                                  <Typography 
                                    variant="subtitle1" 
                                    gutterBottom
                                    sx={{ 
                                      fontWeight: 500,
                                      lineHeight: 1.3
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                  <Box sx={{ mb: 1.5 }}>
                                    <Chip
                                      icon={<FlagIcon fontSize="small" />}
                                      label={task.priority}
                                      color={getPriorityColor(task.priority)}
                                      size="small"
                                      sx={{ mr: 1, fontSize: '0.75rem' }}
                                    />
                                    {task.dueDate && (
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{ 
                                          display: 'inline-block',
                                          bgcolor: 'rgba(0,0,0,0.05)',
                                          p: '2px 6px',
                                          borderRadius: 1
                                        }}
                                      >
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar 
                                      sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        mr: 1,
                                        bgcolor: 'primary.main',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {task.assignee?.name?.charAt(0) || <PersonIcon fontSize="small" />}
                                    </Avatar>
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ fontSize: '0.8rem' }}
                                    >
                                      {task.assignee?.name || 'Unassigned'}
                                    </Typography>
                                  </Box>
                                </CardContent>
                                <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
                                  {canEditTask(task) && (
                                    <Tooltip title="Edit Task">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => setEditTask(task)}
                                        sx={{ 
                                          color: 'primary.main',
                                          '&:hover': {
                                            bgcolor: 'rgba(25, 118, 210, 0.08)'
                                          }
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </CardActions>
                              </Card>
                            </Fade>
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

      <TaskEditDialog
        open={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        task={editTask}
        projectId={projectId}
        onTaskUpdated={handleTaskUpdated}
      />
      
      <TaskEditDialog
        open={createNewTask}
        onClose={() => setCreateNewTask(false)}
        task={null}
        projectId={projectId}
        onTaskUpdated={handleCreateTask}
      />
    </>
  );
};

export default TaskBoard; 