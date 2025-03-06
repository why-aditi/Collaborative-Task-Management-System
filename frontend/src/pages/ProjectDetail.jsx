import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  List,
  ListItem,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const ProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      console.log('Fetching project with ID:', projectId);
      console.log('Current user:', user);
      console.log('Auth token:', localStorage.getItem('token'));
      
      const response = await axios.get(`/api/projects/${projectId}`);
      console.log('Project data received:', response.data);
      setProject(response.data);
    } catch (err) {
      console.error('Error fetching project:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      
      if (err.response?.status === 403) {
        setError('You do not have permission to view this project');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch project details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`/api/projects/${projectId}`, formData)
      fetchProject()
      handleCloseDialog()
    } catch (err) {
      setError('Failed to update project')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/projects/${projectId}`)
      navigate('/projects')
    } catch (err) {
      setError('Failed to delete project')
      console.error(err)
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

  if (!project) {
    return (
      <Container>
        <Typography align="center">Project not found</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                label={project.status}
                color={project.status === 'Active' ? 'success' : 'default'}
                size="small"
              />
              <Box display="flex" alignItems="center">
                <TaskIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {project.tasks.length} tasks
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
              sx={{ ml: 2 }}
            >
              New Task
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Project Timeline */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Timeline
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body1">
                {new Date(project.startDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                End Date
              </Typography>
              <Typography variant="body1">
                {new Date(project.endDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Team Members */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Team Members
            </Typography>
            <Box sx={{ mt: 2 }}>
              <AvatarGroup max={4}>
                {project.members.map((member) => (
                  <Tooltip key={member._id} title={member.user.name}>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {project.tasks.slice(0, 5).map((task) => (
                <Box key={task._id} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    {task.title} - {task.status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Task List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Tasks</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
              >
                Add Task
              </Button>
            </Box>
            <List>
              {project.tasks.map((task) => (
                <React.Fragment key={task._id}>
                  <ListItem
                    button
                    onClick={() => navigate(`/projects/${projectId}/tasks/${task._id}`)}
                  >
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box component="span">
                          <Typography component="span" variant="body2">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                          {' • '}
                          <Typography component="span" variant="body2">
                            Assigned to: {task.assignee.name}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box>
                      <Chip
                        label={task.status}
                        color={
                          task.status === 'Completed'
                            ? 'success'
                            : task.status === 'In Progress'
                            ? 'primary'
                            : 'default'
                        }
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={task.priority}
                        color={
                          task.priority === 'High'
                            ? 'error'
                            : task.priority === 'Medium'
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                      />
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Project Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Project Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="startDate"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="endDate"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenDialog}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Project</ListItemText>
        </MenuItem>
      </Menu>
    </Container>
  )
}

export default ProjectDetail 