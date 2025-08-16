"use client"

import { FormEvent, useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import useLocalStorageState from "../hooks/useLocalStorageState";

const card = "flex flex-col border-2 rounded-xl p-5 bg-white text-black"
const input = "border-transparent border-b-1 focus:border-black transition-border-color ease-out duration-300 active:border-black outline-none"
const button = "bg-black text-white px-4 py-2 rounded-md w-full cursor-pointer"
const label = "font-semibold"

type Filter = 'all' | 'active' | 'completed'

type Task = {
  id: string
  name: string
  description: string
  done: boolean
}

type CreateTaskForm = Partial<Omit<Task, 'done'>>

export default function TodoAppSearch() {
  const defaultForm = {
    name: '',
    description: '',
  }
  const [tasks, setTasks, tasksIsInitialized] = useLocalStorageState<Task[]>('todo-search-tasks', [])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const debouncedSearchKeyword = useDebounce<typeof searchKeyword>(searchKeyword, 100)
  const [filter, setFilter] = useState<Filter>('all')
  const [form, setForm] = useState<CreateTaskForm>(defaultForm)
  const formRef = useRef<HTMLFormElement>(null)
  const activeTasksCount = tasks.filter(task => !task.done).length
  const completedTasksCount = tasks.length - activeTasksCount
  const taskDescriptionRefs = useRef<Record<string, HTMLTextAreaElement | undefined>>({})
  const [editingTaskIds, setEditingTaskIds] = useState<string[]>([])

  const filterTask = (task: Task, filter: Filter, keyword: string) => 
    (keyword ? task.name.toLocaleLowerCase().includes(keyword) : true) && 
    (filter === 'all' ? true : task.done === (filter === 'completed'))

  useEffect(() => {
    const keyword = debouncedSearchKeyword.toLocaleLowerCase().trim()
    console.log({keyword, filter})
    setFilteredTasks(tasks.filter(task => filterTask(task, filter, keyword)))
  }, [tasks, debouncedSearchKeyword, filter])

  const handleFormChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const { name, value } = e.target
    const data = { ...form, [name]: value }
    setForm(data)
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const taskId = crypto.randomUUID()
    const task: Task = {
      id: taskId,
      name: form.name!,
      description: form.description!,
      done: false,
    }
    setTasks([...tasks, task])
    setForm({...defaultForm})

    formRef.current?.reset()
  }

  const handleCheckBoxChange = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const li = e.target.parentElement!;
    li.style.textDecoration = e.target.checked ? 'line-through' : ''
    updateTask(taskId, { done: e.target.checked })
  }

  const updateTask = (taskId: string, options: Partial<Task>) => {
    const t = tasks.map(task => {
      return task.id === taskId ? {...task, ...options} : task
    })
    setTasks(t)
  }

  const deleteTask = (taskId: string) => {
    const t = tasks.filter(task => task.id !== taskId)
    setTasks(t)
  }

  const clearCompleted = () => {
    const t = tasks.filter(task => !task.done)
    setTasks(t)
  }

  const handleEditTask = (taskId: string) => {
    const textarea = taskDescriptionRefs.current[taskId]
    if (textarea) {
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.value.length
        textarea.selectionEnd = textarea.value.length
        console.log({ textarea })
      }, 100)
    }
    setEditingTaskIds([...editingTaskIds, taskId])
  }

  const handleSaveEditTask = (taskId: string) => (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim()
    if (value) updateTask(taskId, { description: value })
    setEditingTaskIds(editingTaskIds.filter(id => id !== taskId))
  }

  return (
    <div className="flex items-center flex-col gap-2">
      {/* Form */}
      <div className={`${card} w-[325px] mt-[40px] mb-2`}>
        {/* Title */}
        <h1 className="text-2xl font-bold mb-5">Create a new task</h1>
        {/* Form */}
        <form className="mb-2" action="" onChange={handleFormChange} onSubmit={handleFormSubmit} ref={formRef}>
          {/* Name */}
          <div className="flex gap-2 mb-1">
            <label className={label} htmlFor="name">Name:</label>
            <input required className={input} type="text" name="name" placeholder="Task name" id="name" />
          </div>
          {/* Description */}
          <div className="flex gap-2 mb-5">
            <label className={label} htmlFor="description">Description:</label>
            <textarea required className={input} name="description" placeholder="Task description" id="description" rows={3}></textarea>
          </div>
          
          {/* Submit */}
          <button className={button} type="submit">Create task</button>
        </form>
      </div>
      {/* Filters */}
      <div className="flex justify-between w-full">
        <button className="text-sm underline cursor-pointer" onClick={clearCompleted}>
          Clear completed tasks
        </button>
        <span className="text-sm text-gray-300 italic">
          {activeTasksCount} active tasks, {completedTasksCount} completed tasks
        </span>
      </div>
      <div className={`${card} w-[80vw]`}>
        <div className="flex justify-between">
          {/* Search */}
          <div className="flex gap-2 mb-3">
            <label className={label} htmlFor="search">Search:</label>
            <input id="search" className={input} type="text" name="search" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} placeholder="Search task" />
          </div>
          {/* Filter */}
          <div>
            <label className={label} htmlFor="filter">Filter:</label>
            <select id="filter" className={input} name="filter" value={filter} onChange={e => setFilter(e.target.value as Filter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        {/* Result */}
        <table className="text-left">
          <thead>
            <tr>
              <th className="h-[50px] w-[50px]"></th>
              <th className={label}>Name</th>
              <th className={label}>Description</th>
              <th className={label}>Status</th>
              <th className={label}>Action</th>
            </tr>
          </thead>
          <tbody>
            {!tasksIsInitialized ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 animate-pulse">Loading tasks...</td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500">
                  {tasks.length === 0 ? 'You have no tasks.' : 'No tasks found with the current filter.'}
                </td>
              </tr>
            ) : (
              filteredTasks.map(task => {
                const isEditing = editingTaskIds.includes(task.id)
                return <tr key={task.id}>
                  <td>
                    <input type="checkbox" onChange={e => handleCheckBoxChange(e, task.id)} checked={task.done} />
                  </td>
                  <td className={`${task.done ? 'line-through' : ''}`}>
                    <span>{task.name}</span>
                  </td>
                  <td className={`${task.done ? 'line-through' : ''} max-w-[240px]`}>
                    <textarea 
                      ref={(el: HTMLTextAreaElement | null) => {
                        if (el) taskDescriptionRefs.current[task.id] = el;
                      }}
                      className={`${input} ${isEditing ? 'block' : 'hidden'} w-full resize-none`} 
                      onBlur={handleSaveEditTask(task.id)} 
                      defaultValue={task.description}
                    />
                    <span className={`${task.done ? 'line-through' : ''} ${isEditing ? 'hidden' : ''}`} onClick={() => handleEditTask(task.id)}>{task.description}</span>
                  </td>
                  <td className="w-[120px]">
                    {task.done ? 'Completed' : 'Active'}
                  </td>
                  <td>
                    <button className="text-red-700 underline cursor-pointer" type="button" onClick={() => deleteTask(task.id)}>Delete</button>
                  </td>
                </tr>
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}