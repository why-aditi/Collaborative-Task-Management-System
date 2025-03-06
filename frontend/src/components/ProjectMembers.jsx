import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProjectMembers = ({ projectId, members, onMembersUpdate }) => {
  const [open, setOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Check if current user is a manager
  const isManager = members.some(member => 
    member.user._id === user._id && member.role === 'Manager'
  );

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/available');
      // Filter out users who are already members
      const existingMemberIds = members.map(member => member.user._id);
      const available = response.data.filter(user => !existingMemberIds.includes(user._id));
      setAvailableUsers(available);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch available users');
    }
  }, [members]);

  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
    }
  }, [open, fetchAvailableUsers]);

  const handleOpen = () => {
    if (!isManager) {
      setError('Only managers can add new members');
      return;
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser('');
    setSelectedRole('Member');
    setError('');
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/projects/${projectId}/members`, {
        userId: selectedUser,
        role: selectedRole
      });
      onMembersUpdate();
      handleClose();
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isManager) {
      setError('Only managers can remove members');
      return;
    }
    try {
      await axios.delete(`/api/projects/${projectId}/members/${userId}`);
      onMembersUpdate();
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Team Members
        </Typography>
        {isManager && (
          <Button
            startIcon={<AddIcon />}
            onClick={handleOpen}
            variant="outlined"
            size="small"
          >
            Add Member
          </Button>
        )}
      </Box>

      <AvatarGroup max={4} sx={{ mb: 2 }}>
        {members.map((member) => (
          <Tooltip
            key={member.user._id}
            title={`${member.user.fullName} (${member.role})`}
          >
            <Avatar>
              <PersonIcon />
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>

      <List>
        {members.map((member) => (
          <ListItem key={member.user._id}>
            <ListItemText
              primary={member.user.fullName}
              secondary={member.user.email}
            />
            <ListItemSecondaryAction>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={member.role}
                  color={member.role === 'Manager' ? 'primary' : 'default'}
                  size="small"
                />
                {isManager && member.user._id !== user._id && (
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveMember(member.user._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              label="Select User"
            >
              {availableUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Role"
            >
              <MenuItem value="Member">Member</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            disabled={loading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectMembers; 