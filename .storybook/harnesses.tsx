import { useState, type ComponentProps, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Outlet } from 'react-router-dom';
import type { TournamentFormValues } from '../src/pages/CreateTournamentPage';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Label } from '../src/components/ui/Label';
import { FieldGroupLabel } from '../src/components/ui/FieldGroupLabel';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../src/components/ui/Card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../src/components/ui/Table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../src/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../src/components/ui/Tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../src/components/ui/Popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../src/components/ui/Tabs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../src/components/ui/Dialog';
import { CustomDialog } from '../src/components/CustomDialog';
import { ModalShell } from '../src/components/ModalShell';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ToastContainer } from '../src/components/Toast';
import { showToast } from '../src/utils/toastUtils';
import { PlayerInput } from '../src/components/PlayerInput';
import { ParticipantPlayerInput } from '../src/components/common/ParticipantPlayerInput';
import { buildParticipants } from '../src/utils/participantUtils';
import { GroupCard } from '../src/components/groupstage/GroupCard';
import { TabBar } from '../src/components/common/TabBar';
import { Layout } from '../src/components/Layout';
import { players as fixturePlayers } from './fixtures';

export const FieldExample = ({
  disabled = false,
}: {
  disabled?: boolean;
}): ReactElement => (
  <div>
    <FieldGroupLabel>Player details</FieldGroupLabel>
    <Label htmlFor="example-name">Name</Label>
    <Input id="example-name" defaultValue="Alice" disabled={disabled} />
  </div>
);

export const CardExample = (): ReactElement => (
  <Card>
    <CardHeader>
      <CardTitle>Club championship</CardTitle>
      <CardDescription>Saturday singles</CardDescription>
    </CardHeader>
    <CardContent>Eight players, single elimination.</CardContent>
    <CardFooter>
      <Button>Open tournament</Button>
    </CardFooter>
  </Card>
);

export const TableExample = (): ReactElement => (
  <Table>
    <TableCaption>Final standings</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Player</TableHead>
        <TableHead>Wins</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>Alice</TableCell>
        <TableCell>3</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Boris</TableCell>
        <TableCell>2</TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell>Total</TableCell>
        <TableCell>5</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);

export const SelectExample = ({
  disabled = false,
}: {
  disabled?: boolean;
}): ReactElement => (
  <Select defaultValue="single" disabled={disabled}>
    <SelectTrigger aria-label="Tournament format">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Elimination</SelectLabel>
        <SelectItem value="single">Single elimination</SelectItem>
        <SelectItem value="double">Double elimination</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>League</SelectLabel>
        <SelectItem value="robin">Round robin</SelectItem>
        <SelectItem value="swiss">Swiss</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

export const TooltipExample = (): ReactElement => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>Hover or focus</Button>
      </TooltipTrigger>
      <TooltipContent>Start a new tournament</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
export const PopoverExample = (): ReactElement => (
  <Popover>
    <PopoverTrigger asChild>
      <Button>Show options</Button>
    </PopoverTrigger>
    <PopoverContent>
      <Label htmlFor="popover-name">Tournament name</Label>
      <Input id="popover-name" defaultValue="Club championship" />
    </PopoverContent>
  </Popover>
);
export const TabsExample = (): ReactElement => (
  <Tabs defaultValue="schedule">
    <TabsList>
      <TabsTrigger value="schedule">Schedule</TabsTrigger>
      <TabsTrigger value="results">Results</TabsTrigger>
    </TabsList>
    <TabsContent value="schedule">Matches to play</TabsContent>
    <TabsContent value="results">Final standings</TabsContent>
  </Tabs>
);

export const DialogExample = ({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}): ReactElement => (
  <Dialog defaultOpen={initiallyOpen}>
    <DialogTrigger asChild>
      <Button>Open dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tournament settings</DialogTitle>
        <DialogDescription>Update the tournament name.</DialogDescription>
      </DialogHeader>
      <Label htmlFor="dialog-name">Name</Label>
      <Input id="dialog-name" defaultValue="Club championship" />
      <DialogFooter>
        <DialogClose asChild>
          <Button>Save</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const CustomDialogExample = (): ReactElement => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open custom dialog
      </Button>
      <CustomDialog
        open={open}
        onOpenChange={setOpen}
        onPrimaryAction={() => {
          setOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save changes?</DialogTitle>
            <DialogDescription>
              Enter confirms, Escape closes.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogContent>
      </CustomDialog>
    </>
  );
};

export const ModalShellExample = (): ReactElement => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open modal shell
      </Button>
      {open && (
        <ModalShell
          onClose={() => {
            setOpen(false);
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Modal shell</CardTitle>
            </CardHeader>
            <CardContent>Use Escape or the backdrop to close.</CardContent>
          </Card>
        </ModalShell>
      )}
    </>
  );
};

const ThrowError = (): never => {
  throw new Error('Storybook demonstration error');
};
export const ErrorExample = ({
  fails = false,
}: {
  fails?: boolean;
}): ReactElement => (
  <ErrorBoundary>
    {fails ? <ThrowError /> : <p>The application loaded successfully.</p>}
  </ErrorBoundary>
);

export const ToastExample = ({
  withAction = false,
}: {
  withAction?: boolean;
}): ReactElement => (
  <>
    <Button
      onClick={() => {
        showToast({
          message: 'Tournament saved',
          ...(withAction
            ? {
                action: {
                  label: 'Undo',
                  onClick: (): void => {
                    showToast({ message: 'Undone' });
                  },
                },
              }
            : {}),
        });
      }}
    >
      Show notification
    </Button>
    <ToastContainer />
  </>
);

export const PlayerInputExample = ({
  empty = false,
  useElo = true,
}: {
  empty?: boolean;
  useElo?: boolean;
}): ReactElement => {
  const [players, setPlayers] = useState(
    empty ? [] : fixturePlayers.slice(0, 4),
  );
  const {
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TournamentFormValues>({
    defaultValues: { playerName: '', playerElo: 1000 },
  });
  return (
    <PlayerInput
      players={players}
      setPlayers={setPlayers}
      register={register}
      errors={errors}
      setValue={setValue}
      useElo={useElo}
      onAddPlayer={() => {
        const name = getValues('playerName').trim();
        if (!name) return;
        setPlayers([
          ...players,
          { id: crypto.randomUUID(), name, elo: getValues('playerElo') },
        ]);
        setValue('playerName', '');
      }}
    />
  );
};

export const ParticipantInputExample = ({
  teamSize = 2,
  incomplete = false,
}: {
  teamSize?: number;
  incomplete?: boolean;
}): ReactElement => {
  const [players, setPlayers] = useState(
    fixturePlayers.slice(0, incomplete ? 3 : 4),
  );
  const [participants, setParticipants] = useState(() =>
    buildParticipants(players, teamSize, []),
  );
  return (
    <ParticipantPlayerInput
      players={players}
      participants={participants}
      teamSize={teamSize}
      useElo={true}
      onPlayersChange={(nextPlayers, nextParticipants) => {
        setPlayers(nextPlayers);
        setParticipants(nextParticipants);
      }}
    />
  );
};

export const GroupCardExample = (
  props: ComponentProps<typeof GroupCard>,
): ReactElement => {
  const [tab, setTab] = useState(props.activeTab);
  return <GroupCard {...props} activeTab={tab} onTabChange={setTab} />;
};

export const TabBarExample = (): ReactElement => {
  const [active, setActive] = useState('schedule');
  return (
    <TabBar
      tabs={[
        { id: 'schedule', label: 'Schedule' },
        { id: 'standings', label: 'Standings' },
        { id: 'results', label: 'Results' },
      ]}
      activeId={active}
      onChange={setActive}
    />
  );
};

export const LayoutExample = (): ReactElement => <Layout />;
export const OutletExample = (): ReactElement => (
  <div>
    <Link to="/create">Create a tournament</Link>
    <Outlet />
  </div>
);
