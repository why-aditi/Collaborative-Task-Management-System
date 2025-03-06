import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  Assignment as TaskIcon,
  AssignmentTurnedIn as CompletedIcon,
  Schedule as InProgressIcon,
  Warning as OverdueIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, projectsResponse] = await Promise.all([
          axios.get('/api/tasks/user'),
          axios.get('/api/projects'),
        ])

        setTasks(tasksResponse.data)
        setProjects(projectsResponse.data)
      } catch (err) {
        setError('Failed to fetch dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'primary'
      case 'To-Do':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error'
      case 'Medium':
        return 'warning'
      case 'Low':
        return 'success'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {user.name}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Here's an overview of your tasks and projects
            </Typography>
          </Paper>
        </Grid>

        {/* Task Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Task Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <TaskIcon />
                </ListItemIcon>
                <ListItemText primary="Total Tasks" secondary={tasks.length} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CompletedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Completed"
                  secondary={tasks.filter((task) => task.status === 'Completed').length}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InProgressIcon />
                </ListItemIcon>
                <ListItemText
                  primary="In Progress"
                  secondary={tasks.filter((task) => task.status === 'In Progress').length}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <OverdueIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Overdue"
                  secondary={
                    tasks.filter(
                      (task) =>
                        task.status !== 'Completed' &&
                        new Date(task.dueDate) < new Date()
                    ).length
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Tasks</Typography>
              <Button variant="contained" onClick={() => navigate('/projects')}>
                View All Tasks
              </Button>
            </Box>
            <List>
              {tasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task._id}
                  button
                  onClick={() =>
                    navigate(`/projects/${task.project._id}/tasks/${task._id}`)
                  }
                >
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box component="span">
                        <Typography component="span" variant="body2">
                          {task.project.name}
                        </Typography>
                        {' • '}
                        <Typography component="span" variant="body2">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box>
                    <Chip
                      label={task.status}
                      color={getTaskStatusColor(task.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Active Projects */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Active Projects</Typography>
              <Button variant="contained" onClick={() => navigate('/projects')}>
                View All Projects
              </Button>
            </Box>
            <Grid container spacing={2}>
              {projects.slice(0, 3).map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project._id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <Typography variant="h6" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {project.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {project.tasks.length} tasks
                      </Typography>
                      <Chip
                        label={project.status}
                        color={project.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Dashboard 