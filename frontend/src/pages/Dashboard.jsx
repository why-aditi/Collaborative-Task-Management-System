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
  Alert,
} from '@mui/material'
import {
  Assignment as TaskIcon,
  AssignmentTurnedIn as CompletedIcon,
  Schedule as InProgressIcon,
  Warning as OverdueIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProjectEditDialog from '../components/ProjectEditDialog'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openProjectDialog, setOpenProjectDialog] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, projectsResponse] = await Promise.all([
          api.get('/api/tasks/user'),
          api.get('/api/projects'),
        ])

        setTasks(tasksResponse.data)
        setProjects(projectsResponse.data)
        setError('')
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.')
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getTaskStatusColor = (status) => {
    const colors = {
      'Not Started': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'Overdue': 'error',
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'success',
      'Medium': 'warning',
      'High': 'error',
    }
    return colors[priority] || 'default'
  }

  const handleOpenProjectDialog = () => {
    setOpenProjectDialog(true)
  }

  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false)
  }

  const handleProjectUpdated = (newProject) => {
    // Navigate to the project detail page
    navigate(`/projects/${newProject._id}`)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenProjectDialog}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            {tasks.length === 0 ? (
              <Typography color="text.secondary">No tasks found.</Typography>
            ) : (
              <List>
                {tasks.slice(0, 5).map((task) => (
                  <ListItem
                    key={task._id}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    button
                    onClick={() => navigate(`/projects/${task.project}/tasks/${task._id}`)}
                  >
                    <ListItemIcon>
                      <TaskIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
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
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Project Overview
            </Typography>
            {projects.length === 0 ? (
              <Typography color="text.secondary">No projects found.</Typography>
            ) : (
              <List>
                {projects.slice(0, 3).map((project) => (
                  <ListItem
                    key={project._id}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    button
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <ListItemText
                      primary={project.name}
                      secondary={`${project.tasks?.length || 0} tasks`}
                    />
                  </ListItem>
                ))}
                {projects.length > 3 && (
                  <Button
                    color="primary"
                    onClick={() => navigate('/projects')}
                    sx={{ mt: 1 }}
                  >
                    View All Projects
                  </Button>
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Project Edit Dialog */}
      <ProjectEditDialog
        open={openProjectDialog}
        onClose={handleCloseProjectDialog}
        project={null}
        onProjectUpdated={handleProjectUpdated}
      />
    </Box>
  )
}

export default Dashboard 