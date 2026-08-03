import { Box, Button, Typography } from '@mui/material'

export function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <Box className="page-heading">
      <Box>
        <Typography variant="h4" component="h1" fontWeight={750}>
          {title}
        </Typography>
        <Typography color="text.secondary" mt={0.5}>
          {description}
        </Typography>
      </Box>
      {actionLabel && (
        <Button variant="contained" onClick={onAction}>
          + {actionLabel}
        </Button>
      )}
    </Box>
  )
}
