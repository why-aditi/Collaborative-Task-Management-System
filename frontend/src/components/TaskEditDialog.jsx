import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Lock as LockIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TaskEditDialog = ({ open, onClose, task, projectId, onTaskUpdated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    status: 'To-Do',
  });
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isProjectManager, setIsProjectManager] = useState(false);
  const isNewTask = !task;

  // Check if the current user can edit this task
  const canEditTask = useCallback(() => {
    if (isNewTask) return true; // Anyone can create a new task
    if (isProjectOwner || isProjectManager) return true; // Owners and managers can edit any task
    
    // Users can edit tasks they're assigned to or reported
    return task?.assignee?._id === user?._id || task?.reporter?._id === user?._id;
  }, [isNewTask, isProjectOwner, isProjectManager, task, user?._id]);

  const fetchProjectMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      console.log('Fetching project members for project:', projectId);
      
      // Make sure we have a valid projectId
      if (!projectId) {
        console.error('No projectId provided for fetching members');
        setProjectMembers([]);
        return;
      }
      
      // Get the project details first
      const response = await axios.get(`/api/projects/${projectId}`);
      console.log('Project data received:', response.data);
      
      if (!response.data) {
        console.error('No project data received');
        setProjectMembers([]);
        return;
      }
      
      // Check if the current user is the project owner
      setIsProjectOwner(response.data.owner?._id === user?._id);
      
      // Check if the current user is a project manager
      setIsProjectManager(
        response.data.members?.some(member => 
          member.user?._id === user?._id && 
          (member.role === 'Manager' || member.role === 'Admin')
        )
      );
      
      // Create a members array with the project owner and team members
      let members = [];
      
      // Add the owner if available
      if (response.data.owner) {
        members.push({
          user: response.data.owner,
          role: 'Owner'
        });
      }
      
      // Add team members if available
      if (response.data.members && Array.isArray(response.data.members)) {
        members = [...members, ...response.data.members];
      }
      
      console.log('Processed members list:', members);
      setProjectMembers(members);
    } catch (err) {
      console.error('Error fetching project members:', err);
      // Check if we have a response with error details
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId, user?._id]);

  // Fetch project members when the dialog opens
  useEffect(() => {
    if (open && projectId) {
      console.log('Dialog opened, fetching project members for projectId:', projectId);
      fetchProjectMembers();
      
      // Add a retry mechanism in case the first attempt fails
      const retryTimeout = setTimeout(() => {
        if (projectMembers.length === 0) {
          console.log('No project members found after initial fetch, retrying...');
          fetchProjectMembers();
        }
      }, 1000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [open, projectId, fetchProjectMembers, projectMembers.length]);

  // Validate assignee value when project members change
  useEffect(() => {
    if (projectMembers.length > 0 && formData.assignee) {
      // Check if the current assignee value is valid
      const isValidAssignee = projectMembers.some(member => member.user._id === formData.assignee);
      
      if (!isValidAssignee) {
        console.warn('Invalid assignee value detected:', formData.assignee);
        console.log('Available member IDs:', projectMembers.map(m => m.user._id));
        
        // Reset the assignee value
        setFormData(prev => ({
          ...prev,
          assignee: ''
        }));
      }
    }
  }, [projectMembers, formData.assignee]);

  useEffect(() => {
    if (open) {
      if (task) {
        // Edit existing task
        console.log('Setting form data for existing task:', task);
        setFormData({
          title: task.title || '',
          description: task.description || '',
          assignee: task.assignee?._id || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          priority: task.priority || 'Medium',
          status: task.status || 'To-Do',
        });
      } else {
        // Create new task
        console.log('Setting form data for new task');
        setFormData({
          title: '',
          description: '',
          assignee: user?._id || '', // Default to current user
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'Medium',
          status: 'To-Do',
        });
      }
      setError('');
      setSuccess(false);
    }
  }, [task, open, user?._id]);

  // Load existing attachments when editing a task
  useEffect(() => {
    if (open && task && task.attachments) {
      setAttachments(task.attachments);
    } else {
      setAttachments([]);
    }
  }, [open, task]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `/api/tasks/${task._id}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percentCompleted
            }));
          }
        }
      );
      
      // Update attachments list with the new file
      setAttachments(prev => [...prev, response.data]);
      
      // Remove file from pending uploads
      setFiles(prev => prev.filter(f => f.name !== file.name));
      
      // Clear progress for this file
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });

      return response.data;
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      setError(`Failed to upload ${file.name}: ${error.response?.data?.message || error.message}`);
      
      // Mark file as failed
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 'failed'
      }));
      
      throw error;
    }
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    
    // Filter out files that exceed size limit (10MB)
    const validFiles = newFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setFiles(prevFiles => [...prevFiles, ...validFiles]);
    
    // Initialize progress for new files
    const newProgress = {};
    validFiles.forEach(file => {
      newProgress[file.name] = 0;
    });
    setUploadProgress(prev => ({ ...prev, ...newProgress }));
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await axios.delete(`/api/tasks/${task._id}/attachments/${attachmentId}`);
      setAttachments(prev => prev.filter(a => a._id !== attachmentId));
    } catch (err) {
      console.error('Error removing attachment:', err);
      setError('Failed to remove attachment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check permissions
    if (!canEditTask()) {
      setError('Permission denied: You can only edit your own tasks');
      return;
    }

    // Validate required fields
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    if (!formData.assignee) {
      setError('Assignee is required');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let response;
      
      if (isNewTask) {
        // Create task first
        const taskData = {
          ...formData,
          projectId: projectId,
        };
        
        response = await axios.post('/api/tasks', taskData);
        
        // Upload files if any
        if (files.length > 0) {
          for (const file of files) {
            try {
              await uploadFile(file);
            } catch (error) {
              // Continue with other files even if one fails
              console.error(`Failed to upload ${file.name}:`, error);
            }
          }
        }
      } else {
        // Update task
        const allowedUpdates = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate,
          assignee: formData.assignee,
          status: formData.status,
        };
        
        response = await axios.patch(`/api/tasks/${task._id}`, allowedUpdates);
        
        // Upload files if any
        if (files.length > 0) {
          for (const file of files) {
            try {
              await uploadFile(file);
            } catch (error) {
              // Continue with other files even if one fails
              console.error(`Failed to upload ${file.name}:`, error);
            }
          }
        }
      }

      setSuccess(true);
      onTaskUpdated(response.data);
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(`Error ${isNewTask ? 'creating' : 'updating'} task:`, err);
      const errorMessage = err.response?.data?.errors ? 
        err.response.data.errors.map(e => e.msg).join(', ') :
        err.response?.data?.message || 
        `Failed to ${isNewTask ? 'create' : 'update'} task. ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // If the user doesn't have permission to edit this task, show a message
  if (!isNewTask && !canEditTask() && open) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'error.main',
          color: 'white',
          py: 1.5
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            Permission Denied
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            You don't have permission to edit this task.
          </Alert>
          <Typography variant="body1" paragraph>
            You can only edit tasks that:
          </Typography>
          <ul>
            <li>Are assigned to you</li>
            <li>Were created by you</li>
            <li>Are in a project where you are the owner or a manager</li>
          </ul>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0,0,0,0.03)' }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{ borderRadius: 1 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: isNewTask ? 'success.main' : 'primary.main',
        color: 'white',
        py: 1.5
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          {isNewTask ? <AddIcon sx={{ mr: 1 }} /> : null}
          {isNewTask ? 'Create New Task' : 'Edit Task'}
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Task {isNewTask ? 'created' : 'updated'} successfully!
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
              Task Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              required
              value={formData.title}
              onChange={handleInputChange}
              error={!formData.title}
              helperText={!formData.title ? 'Title is required' : ''}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
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
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
              InputLabelProps={{
                shrink: true,
              }}
              placeholder="Enter task description..."
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Assignee</InputLabel>
              <Select
                name="assignee"
                value={formData.assignee || ''}
                onChange={handleInputChange}
                label="Assignee"
                required
                sx={{ borderRadius: 1 }}
                MenuProps={{
                  PaperProps: {
                    sx: { borderRadius: 1, mt: 0.5, maxHeight: 300 }
                  }
                }}
                renderValue={(selected) => {
                  console.log('Selected assignee ID:', selected);
                  console.log('Available project members:', projectMembers);
                  // Find the member with the selected user ID
                  const member = projectMembers.find(m => m.user?._id === selected);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                        {member?.user?.name?.charAt(0) || <PersonIcon fontSize="small" />}
                      </Avatar>
                      <Typography>{member?.user?.name || 'Select Team Member'}</Typography>
                    </Box>
                  );
                }}
              >
                {/* Always include an empty option */}
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                
                {loadingMembers ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading team members...
                  </MenuItem>
                ) : projectMembers.length === 0 ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                      <Typography variant="body2" color="error">No team members available</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add members to the project first
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  <>
                    {/* Group by role */}
                    {projectMembers.some(m => m.role === 'Owner') && (
                      <MenuItem disabled sx={{ opacity: 0.7, fontWeight: 'bold', bgcolor: 'background.paper' }}>
                        Project Owner
                      </MenuItem>
                    )}
                    
                    {/* Show owners */}
                    {projectMembers
                      .filter(member => member.role === 'Owner')
                      .map(member => {
                        if (!member.user || !member.user._id) return null;
                        return (
                          <MenuItem key={member.user._id} value={member.user._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                                {member.user?.name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography>{member.user?.name || member.user?.email || 'Unknown User'}</Typography>
                            </Box>
                          </MenuItem>
                        );
                      }).filter(Boolean)}
                    
                    {/* Team Members header */}
                    {projectMembers.some(m => m.role !== 'Owner') && (
                      <MenuItem disabled sx={{ opacity: 0.7, fontWeight: 'bold', bgcolor: 'background.paper' }}>
                        Team Members
                      </MenuItem>
                    )}
                    
                    {/* Show team members */}
                    {projectMembers
                      .filter(member => member.role !== 'Owner')
                      .map(member => {
                        if (!member.user || !member.user._id) return null;
                        return (
                          <MenuItem key={member.user._id} value={member.user._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                                {member.user?.name?.charAt(0) || '?'}
                              </Avatar>
                              <Typography>{member.user?.name || member.user?.email || 'Unknown User'}</Typography>
                            </Box>
                          </MenuItem>
                        );
                      }).filter(Boolean)}
                  </>
                )}
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              name="dueDate"
              label="Due Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1 },
                startAdornment: (
                  <CalendarIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FlagIcon fontSize="small" sx={{ mr: 1 }} />
              Status & Priority
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  label="Priority"
                  sx={{ borderRadius: 1 }}
                  MenuProps={{
                    PaperProps: {
                      sx: { borderRadius: 1, mt: 0.5 }
                    }
                  }}
                >
                  <MenuItem value="Low">
                    <Chip 
                      size="small" 
                      label="Low" 
                      color="success" 
                      icon={<FlagIcon />} 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="Medium">
                    <Chip 
                      size="small" 
                      label="Medium" 
                      color="warning" 
                      icon={<FlagIcon />} 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="High">
                    <Chip 
                      size="small" 
                      label="High" 
                      color="error" 
                      icon={<FlagIcon />} 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                  sx={{ borderRadius: 1 }}
                  MenuProps={{
                    PaperProps: {
                      sx: { borderRadius: 1, mt: 0.5 }
                    }
                  }}
                >
                  <MenuItem value="To-Do">
                    <Chip 
                      size="small" 
                      label="To-Do" 
                      color="default" 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Chip 
                      size="small" 
                      label="In Progress" 
                      color="primary" 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Chip 
                      size="small" 
                      label="Completed" 
                      color="success" 
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
              Attachments
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* Existing Attachments */}
            {attachments.length > 0 && (
              <List dense sx={{ mb: 2 }}>
                {attachments.map((attachment) => (
                  <ListItem
                    key={attachment._id}
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon>
                      <FileIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={attachment.filename}
                      secondary={`Uploaded by ${attachment.uploadedBy?.name || 'Unknown'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveAttachment(attachment._id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            {/* New File Uploads */}
            {files.length > 0 && (
              <List dense sx={{ mb: 2 }}>
                {files.map((file, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: uploadProgress[file.name] === 'failed' ? 'error.main' : 'divider',
                    }}
                  >
                    <ListItemIcon>
                      <FileIcon color={uploadProgress[file.name] === 'failed' ? 'error' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={
                        uploadProgress[file.name] === 'failed' 
                          ? 'Upload failed' 
                          : uploadProgress[file.name] === 100
                          ? 'Upload complete'
                          : `${uploadProgress[file.name] || 0}% uploaded`
                      }
                    />
                    <ListItemSecondaryAction>
                      {uploadProgress[file.name] !== 100 && (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveFile(index)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              sx={{ borderRadius: 1 }}
            >
              Add Attachments
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'rgba(0,0,0,0.03)' }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color={isNewTask ? 'success' : 'primary'}
            disabled={loading || !formData.title}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 1 }}
          >
            {loading ? 'Saving...' : isNewTask ? 'Create Task' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskEditDialog; 