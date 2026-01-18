/**
 * UI Component Barrel Exports
 * 
 * SICHERHEIT: Alle Imports aus diesem Verzeichnis nutzen automatisch
 * sichere Versionen der Komponenten.
 * 
 * VERWENDUNG:
 * import { Input, Button, Card } from "@/components/ui";
 * 
 * REGELN:
 * - Input/Textarea sind automatisch SecureInput/SecureTextarea
 * - Für File-Inputs: import { RawInput } from "@/components/ui/input"
 */

// Secure Input Components (default exports)
export { SecureInput as Input, SecureTextarea as Textarea } from "./secure-input";
export type { SecureInputProps as InputProps } from "./secure-input";

// Raw Input for special cases (file uploads)
export { RawInput } from "./input";

// Standard UI Components
export { Button, buttonVariants } from "./button";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
export { Label } from "./label";
export { Badge, badgeVariants } from "./badge";
export { Switch } from "./switch";
export { Checkbox } from "./checkbox";
export { Separator } from "./separator";
export { Skeleton } from "./skeleton";
export { Progress } from "./progress";
export { ScrollArea, ScrollBar } from "./scroll-area";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

// Dialog & Overlays
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

// Select & Dropdown
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// Tabs
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

// Accordion
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

// Table
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

// Form
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "./form";

